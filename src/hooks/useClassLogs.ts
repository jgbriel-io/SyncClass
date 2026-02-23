import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { getClassStatusWithTime } from "@/lib/utils/classTime";

const DEFAULT_PAGE_SIZE = 10;

export type ClassLogsStatusFilter = "all" | "agendada" | "avaliacao_pendente" | "concluida";

export type ClassLogsFilters = {
  teacherId?: string;
  studentId?: string;
  period?: "all" | "week" | "month" | "3months";
  status?: ClassLogsStatusFilter;
};

function getDateRangeForPeriod(period: "week" | "month" | "3months"): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  let from: Date;
  let to: Date;
  if (period === "week") {
    const start = new Date(y, m, d);
    start.setDate(start.getDate() - start.getDay());
    from = start;
    to = new Date(start);
    to.setDate(to.getDate() + 6);
  } else if (period === "month") {
    from = new Date(y, m, 1);
    to = new Date(y, m + 1, 0);
  } else {
    from = new Date(y, m - 3, d);
    to = new Date(y, m, d);
  }
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

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
    queryFn: async () => {
      let q = supabase
        .from("class_logs")
        .select(
          `
          *,
          students (
            name,
            teacher_id
          ),
          teachers (
            name
          ),
          financial_records (
            id,
            status,
            amount,
            due_date,
            payment_proof_url,
            payment_proof_filename,
            payment_proof_status
          ),
          financial_record_class_logs (
            financial_record_id,
            financial_records (
              id,
              status,
              amount,
              due_date,
              payment_proof_url,
              payment_proof_filename,
              payment_proof_status
            )
          )
        `,
          { count: "exact" }
        )
        .order("class_date", { ascending: false });

      const effectiveTeacherId = teacherId ?? (filters?.teacherId !== "all" ? filters?.teacherId : undefined);
      
      // Filtra por students.teacher_id (professor do aluno) em vez de class_logs.teacher_id
      // porque class_logs.teacher_id pode ser NULL mesmo quando a aula pertence a um aluno desse professor
      if (effectiveTeacherId) {
        const { data: teacherStudentIds } = await supabase
          .from("students")
          .select("id")
          .eq("teacher_id", effectiveTeacherId);
        
        if (teacherStudentIds && teacherStudentIds.length > 0) {
          q = q.in("student_id", teacherStudentIds.map(s => s.id));
        } else {
          return { list: [] as ClassLogWithStudent[], count: 0 };
        }
      }

      if (filters?.studentId && filters.studentId !== "all") {
        q = q.eq("student_id", filters.studentId);
      }

      if (filters?.period && filters.period !== "all") {
        const { from, to } = getDateRangeForPeriod(filters.period);
        q = q.gte("class_date", from).lte("class_date", to);
      }

      // NÃO aplicar filtro de status no banco - deixar tudo client-side
      // Isso garante que todas as aulas sejam retornadas e filtradas no componente

      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await q.range(from, to);

      if (error) throw error;
      const list = (data ?? []) as ClassLogWithStudent[];
      await enrichWithPackageFinancial(list);
      return { list, count: count ?? 0 };
    },
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

/** Enriquece lista de aulas com financial_records vindos de pacote (financial_record_class_logs). */
async function enrichWithPackageFinancial(
  list: ClassLogWithStudent[]
): Promise<ClassLogWithStudent[]> {
  const withoutFinancial = list.filter((log) => !log.financial_records || log.financial_records.length === 0);
  
  if (withoutFinancial.length === 0) return list;
  const logIds = withoutFinancial.map((l) => l.id);
  const { data: links } = await supabase
    .from("financial_record_class_logs")
    .select("class_log_id, financial_record_id")
    .in("class_log_id", logIds);
  
  if (!links?.length) return list;
  const frIds = [...new Set(links.map((r) => r.financial_record_id))];
  const { data: frs } = await supabase
    .from("financial_records")
    .select("id, status, amount, due_date, description, payment_proof_url, payment_proof_filename, payment_proof_status")
    .in("id", frIds);
  const frMap = new Map((frs ?? []).map((fr) => [fr.id, fr]));
  const logToFr = new Map(links.map((r) => [r.class_log_id, r.financial_record_id]));
  withoutFinancial.forEach((log) => {
    const frId = logToFr.get(log.id);
    const fr = frId ? frMap.get(frId) : null;
    if (fr) {
      (log as ClassLogWithStudent).financial_records = [fr];
      (log as ClassLogWithStudent).financial_record_via_package = true;
    }
  });
  return list;
}

/** Busca aulas por lista de student_ids (ex.: para enriquecer lista paginada de alunos) */
export function useClassLogsByStudentIds(studentIds: string[]) {
  return useQuery({
    queryKey: ["class_logs_by_student_ids", studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [] as ClassLogWithStudent[];
      const { data, error } = await supabase
        .from("class_logs")
        .select(`
          *,
          students ( name, teacher_id ),
          teachers ( name ),
          financial_records ( id, status, amount, due_date, payment_proof_url, payment_proof_filename, payment_proof_status )
        `)
        .in("student_id", studentIds)
        .order("class_date", { ascending: false });
      if (error) throw error;
      const list = (data ?? []) as ClassLogWithStudent[];
      return enrichWithPackageFinancial(list);
    },
    enabled: studentIds.length > 0,
  });
}

/** Aulas em aberto para avaliação (attendance/grade não preenchidos, data já passou). Usado no sino de notificações. Não filtra por teacher_id: RLS já restringe ao professor (só vê aulas dos seus alunos); filtrar por teacher_id excluiria aulas com teacher_id nulo. */
export function usePendingEvaluationClassLogs(teacherId?: string | null) {
  return useQuery({
    queryKey: ["class_logs_pending_evaluation", teacherId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("class_logs")
        .select(`
          *,
          students ( name, teacher_id ),
          teachers ( name ),
          financial_records ( id, status, amount, due_date, payment_proof_url, payment_proof_filename, payment_proof_status )
        `)
        .is("attendance", null)
        .lte("class_date", todayStr)
        .order("class_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      const list = (data ?? []) as ClassLogWithStudent[];
      const enriched = await enrichWithPackageFinancial(list);
      return enriched.filter((log) => getClassStatusWithTime(log).label === "Pendente");
    },
  });
}

// Buscar aulas de um aluno específico que ainda não têm cobrança vinculada
// Opcionalmente pode filtrar por professor (para telas de admin)
export function useAvailableClassLogsForStudent(studentId: string | null, teacherId?: string) {
  return useQuery({
    queryKey: ["available_class_logs", studentId, teacherId],
    queryFn: async () => {
      if (!studentId) return [];

      // Buscar todas as aulas do aluno. Não filtrar por class_logs.teacher_id:
      // o aluno já está definido; se o contexto exige um professor, o student_id já implica alunos desse professor.
      const { data: classLogs, error: classLogsError } = await supabase
        .from("class_logs")
        .select("*")
        .eq("student_id", studentId)
        .order("class_date", { ascending: false });

      if (classLogsError) throw classLogsError;

      // Buscar IDs de aulas que já têm cobrança (direta ou via pacote)
      const { data: financialRecords, error: financialError } = await supabase
        .from("financial_records")
        .select("class_log_id")
        .eq("student_id", studentId)
        .not("class_log_id", "is", null);

      if (financialError) throw financialError;

      const usedClassLogIds = new Set(financialRecords?.map(r => r.class_log_id).filter(Boolean) || []);

      const { data: packageLinks } = await supabase
        .from("financial_record_class_logs")
        .select("class_log_id")
        .in("class_log_id", classLogs?.map((l) => l.id) ?? []);

      packageLinks?.forEach((r) => usedClassLogIds.add(r.class_log_id));

      // Filtrar aulas disponíveis (sem cobrança)
      return classLogs?.filter(log => !usedClassLogIds.has(log.id)) || [];
    },
    enabled: !!studentId,
  });
}

export function useClassLogsSummary(teacherId?: string | null) {
  return useQuery({
    queryKey: ["class_logs_summary", teacherId],
    queryFn: async () => {
      let query = supabase
        .from("class_logs")
        .select("attendance, grade");
      if (teacherId) {
        const { data: teacherStudentIds } = await supabase
          .from("students")
          .select("id")
          .eq("teacher_id", teacherId);
        if (teacherStudentIds && teacherStudentIds.length > 0) {
          query = query.in("student_id", teacherStudentIds.map((s) => s.id));
        } else {
          return {
            totalClasses: 0,
            totalPresent: 0,
            totalAbsent: 0,
            averageGrade: 0,
            gradesCount: 0,
            gradesSum: 0,
          };
        }
      }
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const summary = {
        totalClasses: data.length,
        totalPresent: 0,
        totalAbsent: 0,
        averageGrade: 0,
        gradesCount: 0,
        gradesSum: 0,
      };

      data.forEach((log) => {
        if (log.attendance) {
          summary.totalPresent++;
        } else {
          summary.totalAbsent++;
        }
        if (log.grade !== null) {
          summary.gradesSum += Number(log.grade);
          summary.gradesCount++;
        }
      });

      if (summary.gradesCount > 0) {
        summary.averageGrade = summary.gradesSum / summary.gradesCount;
      }

      return summary;
    },
  });
}

export function useCreateClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: ClassLogInsert) => {
      // Validação de sobreposição agora é feita no banco via trigger
      const { data, error } = await supabase
        .from("class_logs")
        .insert(log)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
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

/** Valida se há sobreposição de horários entre aulas do pacote */
function validateNoOverlap(items: CreateClassLogPackageItem[]): void {
  if (items.length <= 1) return;

  // Agrupar por data
  const byDate = new Map<string, CreateClassLogPackageItem[]>();
  items.forEach((item) => {
    const date = item.classLog.class_date;
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    byDate.get(date)!.push(item);
  });

  // Verificar sobreposição em cada data
  byDate.forEach((dayItems, date) => {
    if (dayItems.length <= 1) return;

    // Ordenar por horário de início
    const sorted = dayItems.sort((a, b) =>
      (a.classLog.start_at || "").localeCompare(b.classLog.start_at || "")
    );

    // Verificar se há sobreposição entre aulas consecutivas
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i].classLog;
      const next = sorted[i + 1].classLog;

      const currentEnd = current.end_at || "";
      const nextStart = next.start_at || "";

      if (currentEnd > nextStart) {
        const [y, m, d] = date.split("-");
        const formattedDate = `${d}/${m}/${y}`;
        throw new Error(
          `Aulas se sobrepõem no dia ${formattedDate}: ${current.start_at}-${currentEnd} e ${nextStart}-${next.end_at}`
        );
      }
    }
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
    mutationFn: async (id: string) => {
      // Exclui a cobrança vinculada (se existir) antes de excluir a aula
      await supabase
        .from("financial_records")
        .delete()
        .eq("class_log_id", id);

      const { error } = await supabase
        .from("class_logs")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
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
