import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  enrichWithPackageFinancial,
  validateNoOverlap,
  fetchClassLogs,
  fetchClassLogsByStudentIds,
  fetchPendingEvaluationClassLogs,
  fetchAvailableClassLogsForStudent,
  fetchClassLogsSummary,
  createClassLogFn,
  deleteClassLogFn,
} from "./classLogsService";

const DEFAULT_PAGE_SIZE = 10;

export type ClassLogsStatusFilter = "all" | "agendada" | "avaliacao_pendente" | "concluida";

export type ClassLogsFilters = {
  teacherId?: string;
  studentId?: string;
  period?: "all" | "week" | "month" | "3months";
  status?: ClassLogsStatusFilter;
};

export type ClassLog = Tables<"class_logs">;
export type ClassLogInsert = TablesInsert<"class_logs">;
export type ClassLogUpdate = TablesUpdate<"class_logs">;

export interface ClassLogWithStudent extends ClassLog {
  title?: string | null;
  students: {
    name: string;
    teacher_id?: string | null;
  } | null;
  teachers?: {
    name: string;
  } | null;
  financial_records: Array<{
    id: string;
    status: "pendente" | "pago" | "atrasado" | "abonado" | "extornado" | "cancelado" | null;
    amount: number;
    due_date: string;
    description?: string | null;
  }>;
  financial_record_class_logs?: Array<{
    financial_records: {
      id: string;
      status: "pendente" | "pago" | "atrasado" | "abonado" | "extornado" | "cancelado" | null;
      amount: number;
      due_date: string;
      description?: string | null;
    };
  }>;
  /** true quando a cobrança foi vinculada via pacote (financial_record_class_logs) */
  financial_record_via_package?: boolean;
}

export interface ClassLogWithFinancialData {
  classLog: ClassLogInsert;
  createFinancial: boolean;
  /** amount = classLog.billed_amount ?? (hourly_rate * (duration_minutes / 60)); usado ao criar financial_records */
  financialData?: {
    amount: number;
    due_date: string;
    description?: string;
    payment_method?: string | null;
  };
}

export interface UseClassLogsOptions {
  pageSize?: number;
  filters?: ClassLogsFilters;
}

export interface UseClassLogsResult {
  data: ClassLogWithStudent[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

export function useClassLogs(teacherId?: string, options?: UseClassLogsOptions): UseClassLogsResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: ["class_logs", teacherId, page, pageSize, filters],
    queryFn: () => fetchClassLogs(teacherId, page, pageSize, filters),
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as ClassLogWithStudent[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

  // Reset para página 1 quando a página atual fica vazia mas há dados disponíveis
  React.useEffect(() => {
    if (!query.isLoading && list.length === 0 && totalCount > 0 && page > 0) {
      setPage(0);
    }
  }, [list.length, totalCount, page, query.isLoading]);

  return {
    data: list,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isFetching: query.isFetching,
    page,
    setPage,
    hasMore,
    totalCount,
    refetch: query.refetch,
  };
}

/** Busca aulas por lista de student_ids (ex.: para enriquecer lista paginada de alunos) */
export function useClassLogsByStudentIds(studentIds: string[]) {
  return useQuery({
    queryKey: ["class_logs_by_student_ids", studentIds],
    queryFn: () => fetchClassLogsByStudentIds(studentIds),
    enabled: studentIds.length > 0,
  });
}

/** Aulas em aberto para avaliação (attendance/grade não preenchidos, data já passou). Usado no sino de notificações. Não filtra por teacher_id: RLS já restringe ao professor (só vê aulas dos seus alunos); filtrar por teacher_id excluiria aulas com teacher_id nulo. */
export function usePendingEvaluationClassLogs(teacherId?: string | null) {
  return useQuery({
    queryKey: ["class_logs_pending_evaluation", teacherId],
    queryFn: fetchPendingEvaluationClassLogs,
  });
}

// Buscar aulas de um aluno específico que ainda não têm cobrança vinculada
// Opcionalmente pode filtrar por professor (para telas de admin)
export function useAvailableClassLogsForStudent(studentId: string | null, teacherId?: string) {
  return useQuery({
    queryKey: ["available_class_logs", studentId, teacherId],
    queryFn: () => fetchAvailableClassLogsForStudent(studentId!),
    enabled: !!studentId,
  });
}

export function useClassLogsSummary(teacherId?: string | null) {
  return useQuery({
    queryKey: ["class_logs_summary", teacherId],
    queryFn: () => fetchClassLogsSummary(teacherId),
  });
}

export function useCreateClassLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClassLogFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      toast.success("Aula registrada com sucesso!");
    },
    onError: (error) => {
      const msg = (error as Error)?.message || "";
      const code = (error as { code?: string })?.code;
      const isOverlap =
        code === "23P01" ||
        msg.includes("neste horário") ||
        msg.includes("sobreposição") ||
        msg.includes("overlap") ||
        msg.includes("class_logs_no_overlap") ||
        msg.includes("exclusion constraint") ||
        msg.includes("conflicting key") ||
        msg.includes("agendada em");
      toast.error(
        isOverlap
          ? "Já existe outra aula neste horário para este professor. Escolha outro intervalo."
          : "Erro ao registrar aula. Tente novamente."
      );
    },
  });
}

export function useCreateClassLogWithFinancial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classLog, createFinancial, financialData }: ClassLogWithFinancialData) => {
      // Validação de sobreposição agora é feita no banco via trigger
      // Permite cobrança para aulas agendadas (futuras): professor pode deixar em aberto
      // antes da aula; presença e feedback são marcados depois.

      // Primeiro cria a aula
      const { data: createdLog, error: logError } = await supabase
        .from("class_logs")
        .insert(classLog)
        .select()
        .single();

      if (logError) {
        throw logError;
      }

      // Se deve criar cobrança, cria vinculada à aula.
      // financialData.amount = classLog.billed_amount ?? (hourly_rate * duration_minutes/60) — calculado no frontend.
      if (createFinancial && financialData) {
        const [y, m, d] = (classLog.class_date || "").split("-");
        const defaultDescription =
          y && m && d ? `Aula do dia ${d}/${m}/${y}` : `Aula do dia ${classLog.class_date || ""}`;
        const description =
          (typeof financialData.description === "string" && financialData.description.trim())
            ? financialData.description.trim()
            : defaultDescription;

        const { error: financialError } = await supabase
          .from("financial_records")
          .insert({
            student_id: classLog.student_id,
            class_log_id: createdLog.id,
            amount: financialData.amount,
            due_date: financialData.due_date,
            description,
            payment_method: financialData.payment_method || null,
            status: "pendente",
          });

        if (financialError) {
          // Se falhar ao criar cobrança, ainda retorna a aula criada
          toast.error("Aula criada com sucesso, mas não foi possível criar a cobrança.");
          return createdLog;
        }
      }

      return createdLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["available_class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });

      if (variables.createFinancial) {
        toast.success("Aula e cobrança registradas com sucesso!");
      } else {
        toast.success("Aula registrada com sucesso!");
      }
    },
    onError: (error) => {
      const msg = (error as Error)?.message || "";
      const code = (error as { code?: string })?.code;
      const isOverlap =
        code === "23P01" ||
        msg.includes("neste horário") ||
        msg.includes("sobreposição") ||
        msg.includes("overlap") ||
        msg.includes("class_logs_no_overlap") ||
        msg.includes("exclusion constraint") ||
        msg.includes("conflicting key") ||
        msg.includes("agendada em");
      toast.error(
        isOverlap
          ? "Já existe outra aula neste horário para este professor. Escolha outro intervalo."
          : "Erro ao registrar aula. Tente novamente."
      );
    },
  });
}

export type UpdateClassLogPayload = ClassLogUpdate & {
  id: string;
  financialRecordId?: string;
  dueDate?: string;
  amount?: number;
};

export function useUpdateClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, financialRecordId, dueDate, amount, ...updates }: UpdateClassLogPayload) => {
      // Verificar se esta aula faz parte de um pacote ANTES de atualizar
      const { data: packageLink, error: linkError } = await supabase
        .from("financial_record_class_logs")
        .select("financial_record_id")
        .eq("class_log_id", id)
        .maybeSingle();

      if (linkError) throw linkError;

      const isPackage = !!packageLink?.financial_record_id;

      // Validação de sobreposição agora é feita no banco via trigger
      const { data, error } = await supabase
        .from("class_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (financialRecordId) {
        const financialUpdate: { due_date?: string; amount?: number } = {};
        if (dueDate) financialUpdate.due_date = dueDate;
        
        // Se faz parte de um pacote e a duração mudou, recalcular o valor total
        if (isPackage && updates.duration_minutes !== undefined) {
          // Buscar todas as aulas do mesmo pacote (APÓS o update)
          const { data: packageLinks, error: linksError } = await supabase
            .from("financial_record_class_logs")
            .select("class_log_id")
            .eq("financial_record_id", packageLink.financial_record_id);

          if (linksError) throw linksError;

          const classLogIds = packageLinks?.map(l => l.class_log_id) || [];

          // Buscar as aulas e somar as horas (agora com a duração atualizada)
          const { data: packageClasses, error: classesError } = await supabase
            .from("class_logs")
            .select("duration_minutes, student_id")
            .in("id", classLogIds);

          if (classesError) throw classesError;

          if (packageClasses && packageClasses.length > 0) {
            // Buscar o valor/hora do aluno
            const studentId = packageClasses[0].student_id;
            const { data: student, error: studentError } = await supabase
              .from("students")
              .select("hourly_rate")
              .eq("id", studentId)
              .single();

            if (studentError) throw studentError;

            // Calcular o novo valor total do pacote (converter minutos para horas)
            const totalMinutes = packageClasses.reduce((sum, cls) => sum + (cls.duration_minutes || 0), 0);
            const totalHours = totalMinutes / 60;
            const hourlyRate = student?.hourly_rate || 0;
            financialUpdate.amount = totalHours * hourlyRate;

            // Atualizar a cobrança do pacote
            const { error: updateError } = await supabase
              .from("financial_records")
              .update(financialUpdate)
              .eq("id", packageLink.financial_record_id);

            if (updateError) {
              toast.error("Aula atualizada com sucesso, mas não foi possível atualizar a cobrança do pacote.");
            }
            
            return data;
          }
        }
        
        // Se não é pacote ou não mudou duração, atualizar normalmente
        if (amount != null && amount > 0) {
          financialUpdate.amount = amount;
        }
        
        if (Object.keys(financialUpdate).length > 0) {
          const { error: financialError } = await supabase
            .from("financial_records")
            .update(financialUpdate)
            .eq("id", financialRecordId);
          if (financialError) {
            toast.error("Aula atualizada com sucesso, mas não foi possível atualizar a cobrança.");
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_pending_evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      toast.success("Registro atualizado com sucesso!");
    },
    onError: (error) => {
      const msg = (error as Error)?.message || "";
      const code = (error as { code?: string })?.code;
      const isOverlap =
        code === "23P01" ||
        msg.includes("neste horário") ||
        msg.includes("sobreposição") ||
        msg.includes("overlap") ||
        msg.includes("class_logs_no_overlap") ||
        msg.includes("exclusion constraint") ||
        msg.includes("conflicting key") ||
        msg.includes("agendada em");
      toast.error(
        isOverlap
          ? "Já existe outra aula neste horário para este professor. Escolha outro intervalo."
          : "Erro ao atualizar registro. Tente novamente."
      );
    },
  });
}

/** Payload para criar um pacote de aulas em lote */
export interface CreateClassLogPackageItem {
  classLog: ClassLogInsert;
}

/** Cobrança única do pacote (uma linha no financeiro; aulas vinculadas via financial_record_class_logs) */
export interface PackageFinancialData {
  amount: number;
  due_date: string;
  description: string;
  payment_method: string | null;
}

export interface CreateClassLogPackagePayload {
  items: CreateClassLogPackageItem[];
  packageFinancial?: PackageFinancialData | null;
}

export function useCreateClassLogPackage() {
  const queryClient = useQueryClient();
  // Gerar chave de idempotência FORA do mutationFn para garantir idempotência em retries
  const idempotencyKeyRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: async (payload: CreateClassLogPackagePayload) => {
      const { items, packageFinancial } = payload;
      if (items.length === 0) throw new Error("Nenhuma aula no pacote.");

      // Validar sobreposição client-side ANTES de enviar ao banco
      validateNoOverlap(items);

      // Usar chave existente ou gerar nova apenas na primeira tentativa
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
      const idempotencyKey = idempotencyKeyRef.current;

      // Converter para formato do RPC
      const classLogs = items.map((item) => ({
        student_id: item.classLog.student_id,
        teacher_id: item.classLog.teacher_id || null,
        class_date: item.classLog.class_date,
        start_at: item.classLog.start_at,
        end_at: item.classLog.end_at,
        attendance: item.classLog.attendance ?? null,
        notes: item.classLog.notes || null,
        billed_amount: item.classLog.billed_amount ?? null,
      }));

      const financialData = packageFinancial
        ? {
            amount: packageFinancial.amount,
            due_date: packageFinancial.due_date,
            description: packageFinancial.description?.trim() || `Pacote mensal - ${items.length} aulas`,
            payment_method: packageFinancial.payment_method || null,
          }
        : { amount: 0, due_date: null, description: null, payment_method: null };

      // Chamar RPC create_class_package (validação no banco via hooks)
      const { data, error } = await supabase.rpc("create_class_package", {
        p_class_logs: classLogs,
        p_financial_data: financialData,
        p_idempotency_key: idempotencyKey,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Limpar chave após sucesso para permitir nova operação
      idempotencyKeyRef.current = null;
      
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_pending_evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["available_class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      
      // Usar mensagem do RPC
      toast.success(data.message || `${variables.items.length} aula(s) registrada(s) com sucesso!`);
    },
    onError: (error) => {
      // Limpar chave após erro para permitir nova tentativa com nova chave
      idempotencyKeyRef.current = null;
      
      const err = error as Error & { details?: string; code?: string };
      const msg = err?.message || "";
      const details = err?.details ? ` (${err.details})` : "";
      const isOverlap =
        msg.includes("neste horário") ||
        msg.includes("sobrepõem") ||
        msg.includes("overlap") ||
        msg.includes("Duas aulas") ||
        msg.includes("agendada em");
      const displayMsg = isOverlap ? msg : msg ? `${msg}${details}` : "Não foi possível cadastrar o pacote de aulas. Por favor, tente novamente.";
      toast.error(displayMsg);
    },
  });
}

export function useDeleteClassLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClassLogFn,
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_pending_evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Registro removido com sucesso!");
    },
    onError: () => {
      toast.error("Não foi possível remover o registro. Por favor, tente novamente.");
    },
  });
}
