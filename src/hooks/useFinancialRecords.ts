// Hook para desfazer pagamento de uma cobrança
export function useUndoFinancialPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("financial_records")
        .update({ status: "pendente", paid_at: null })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      toast.success("Cobrança desfeita com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useUndoFinancialPayment" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { isOverdue } from "@/lib/utils/financialStatus";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/utils/errorMessages";
import { logger } from "@/lib/sentry";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";

const DEFAULT_PAGE_SIZE = 10;

export type FinancialRecordsFilters = {
  dateFrom?: string;
  dateTo?: string;
  studentId?: string;
  sortBy?: "due_desc" | "due_asc" | "amount_desc" | "amount_asc" | "created_desc" | "created_asc";
};

export type FinancialRecord = Tables<"financial_records">;
export type FinancialRecordInsert = TablesInsert<"financial_records">;
export type FinancialRecordUpdate = TablesUpdate<"financial_records">;

export interface FinancialRecordWithRelations extends FinancialRecord {
  students: {
    name: string;
    teacher_id?: string | null;
  } | null;
  class_logs: {
    id: string;
    class_date: string;
    attendance: boolean | null;
    grade: number | null;
    feedback: string | null;
    title?: string | null;
  } | null;
  confirmed_by?: {
    full_name: string;
  } | null;
  /** Aulas vinculadas quando é uma cobrança de pacote (class_log_id = null) */
  package_classes?: Array<{
    id: string;
    class_date: string;
    title?: string | null;
  }>;
}

export interface UseFinancialRecordsOptions {
  pageSize?: number;
  filters?: FinancialRecordsFilters;
}

export interface UseFinancialRecordsResult {
  data: FinancialRecordWithRelations[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

/** Busca cobranças por lista de student_ids (ex.: para enriquecer lista paginada de alunos) */
export function useFinancialRecordsByStudentIds(studentIds: string[]) {
  return useQuery({
    queryKey: ["financial_records_by_student_ids", studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [] as FinancialRecordWithRelations[];
      const { data, error } = await supabase
        .from("financial_records")
        .select(`
          *,
          students ( name, teacher_id ),
          class_logs ( id, class_date, attendance, grade, feedback, title )
        `)
        .in("student_id", studentIds)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FinancialRecordWithRelations[];
    },
    enabled: studentIds.length > 0,
  });
}

export function useFinancialRecords(
  teacherId?: string | null,
  options?: UseFinancialRecordsOptions
): UseFinancialRecordsResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: ["financial_records", teacherId, page, pageSize, filters],
    queryFn: async () => {
      const sortBy = filters?.sortBy ?? "created_desc";
      const orderCol =
        sortBy.startsWith("amount") ? "amount"
        : sortBy.startsWith("created") ? "created_at"
        : "due_date";
      const ascending = sortBy === "due_asc" || sortBy === "amount_asc" || sortBy === "created_asc";

      let q = supabase
        .from("financial_records")
        .select(
          `
          *,
          students!inner (
            name,
            teacher_id
          ),
          class_logs (
            id,
            class_date,
            attendance,
            grade,
            feedback,
            title
          )
        `,
          { count: "exact" }
        )
        .order(orderCol, { ascending });

      // SEGURANÇA: Filtrar no servidor usando !inner join
      if (teacherId) {
        q = q.eq("students.teacher_id", teacherId);
      }
      if (filters?.studentId && filters.studentId !== "all") {
        q = q.eq("student_id", filters.studentId);
      }
      if (filters?.dateFrom) {
        q = q.gte("due_date", filters.dateFrom);
      }
      if (filters?.dateTo) {
        q = q.lte("due_date", filters.dateTo);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await q.range(from, to);

      if (error) throw error;

      let list = (data ?? []) as FinancialRecordWithRelations[];

      // Buscar nomes dos usuários que confirmaram os pagamentos
      const confirmedByUserIds = Array.from(
        new Set(
          list
            .filter((r) => r.confirmed_by_user_id)
            .map((r) => r.confirmed_by_user_id!)
        )
      );

      if (confirmedByUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", confirmedByUserIds);

        if (profiles) {
          const profileMap = new Map(profiles.map((p) => [p.user_id, p.full_name]));
          list = list.map((record) => ({
            ...record,
            confirmed_by: record.confirmed_by_user_id
              ? { full_name: profileMap.get(record.confirmed_by_user_id) || "" }
              : null,
          }));
        }
      }

      // Buscar aulas vinculadas aos pacotes (quando class_log_id = null)
      const packageRecordIds = list
        .filter((r) => r.class_log_id === null)
        .map((r) => r.id);

      if (packageRecordIds.length > 0) {
        const { data: packageLinks } = await supabase
          .from("financial_record_class_logs")
          .select(
            `
            financial_record_id,
            class_logs (
              id,
              class_date,
              title
            )
          `
          )
          .in("financial_record_id", packageRecordIds);

        if (packageLinks) {
          // Agrupar aulas por financial_record_id
          const packageClassesMap = new Map<string, Array<{ id: string; class_date: string; title?: string | null }>>();
          
          packageLinks.forEach((link: { financial_record_id: string; class_logs: { id: string; class_date: string; title: string | null } | null }) => {
            if (link.class_logs) {
              const existing = packageClassesMap.get(link.financial_record_id) || [];
              existing.push({
                id: link.class_logs.id,
                class_date: link.class_logs.class_date,
                title: link.class_logs.title,
              });
              packageClassesMap.set(link.financial_record_id, existing);
            }
          });

          // Adicionar as aulas aos registros
          list = list.map((record) => ({
            ...record,
            package_classes: packageClassesMap.get(record.id) || undefined,
          }));
        }
      }

      return { list, count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as FinancialRecordWithRelations[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

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

export function useFinancialSummary(teacherId?: string | null) {
  return useQuery({
    queryKey: ["financial_summary", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_records")
        .select("amount, status, due_date, students(teacher_id)");

      if (error) {
        throw error;
      }

      let records = (data || []) as Array<{ amount: number; status: string; due_date: string; students?: { teacher_id?: string } }>;
      if (teacherId) {
        records = records.filter((r) => r.students?.teacher_id === teacherId);
      }

      // Memoizar cálculo do summary
      const summary = {
        totalPending: 0,
        totalPaid: 0,
        totalOverdue: 0,
        totalReceivable: 0,
        countPending: 0,
        countPaid: 0,
        countOverdue: 0,
      };

      records.forEach((record) => {
        accumulateSummary(record, summary);
      });

      // Calcula total a receber (pendente + atrasado)
      summary.totalReceivable = summary.totalPending + summary.totalOverdue;

      return summary;
    },
    // Cache de 5 minutos para dados que mudam pouco
    staleTime: 5 * 60 * 1000,
  });
}

function accumulateSummary(
  record: { amount: number; status: string; due_date: string },
  summary: {
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    countPending: number;
    countPaid: number;
    countOverdue: number;
  }
) {
  const amount = Number(record.amount) || 0;
  if (record.status === "pago") {
    summary.totalPaid += amount;
    summary.countPaid++;
  } else {
    if (isOverdue(record.due_date)) {
      summary.totalOverdue += amount;
      summary.countOverdue++;
    } else {
      summary.totalPending += amount;
      summary.countPending++;
    }
  }
}

export function useCreateFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: FinancialRecordInsert) => {
      // Rate limiting: 3 chamadas por minuto
      const rateLimitResult = checkRateLimit("createFinancialRecord", RATE_LIMIT_CONFIGS.CRITICAL);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Muitas requisições. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
        );
      }

      // Avoid relying on RETURNING/select() here; depending on RLS policies,
      // the insert can succeed while the returning row is not selectable,
      // which makes the UX look like "nothing happened".
      const { error } = await supabase
        .from("financial_records")
        .insert(record);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      toast.success("Cobrança criada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useCreateFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useMarkAsPaid() {
  return useOptimisticMutation<FinancialRecord, string>({
    mutationFn: async (id: string) => {
      // Obter o usuário atual para auditoria
      const { data: { user } } = await supabase.auth.getUser();
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("financial_records")
        .update({
          status: "pago",
          paid_at: now,
          confirmed_by_user_id: user?.id || null,
          confirmed_at: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    queryKey: ["financial_records"],
    optimisticUpdate: (oldData: { list: FinancialRecordWithRelations[]; count: number }, id: string) => {
      const now = new Date().toISOString();
      return {
        ...oldData,
        list: oldData.list.map((record) =>
          record.id === id
            ? { ...record, status: "pago" as const, paid_at: now }
            : record
        ),
      };
    },
    successMessage: "Pagamento registrado com sucesso!",
    errorMessage: "Erro ao registrar pagamento",
    onError: (error) => {
      logger.error(error, { context: "useMarkAsPaid" });
    },
  });
}

export function useUpdateFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: FinancialRecordUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      toast.success("Cobrança atualizada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useDeleteFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Rate limiting: 3 chamadas por minuto
      const rateLimitResult = checkRateLimit("deleteFinancialRecord", RATE_LIMIT_CONFIGS.CRITICAL);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Muitas requisições. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
        );
      }

      const { error } = await supabase
        .from("financial_records")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      toast.success("Cobrança removida com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useDeleteFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
