import React from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/security/errorHandler";
import { logger } from "@/lib/logger";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { QK } from "./queryKeys";

const DEFAULT_PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FinancialRecordsFilters = {
  dateFrom?: string;
  dateTo?: string;
  studentId?: string;
  sortBy?:
    | "due_desc"
    | "due_asc"
    | "amount_desc"
    | "amount_asc"
    | "created_desc"
    | "created_asc";
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

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

async function fetchFinancialRecordsByStudentIds(
  studentIds: string[]
): Promise<FinancialRecordWithRelations[]> {
  const { data, error } = await supabase
    .from("financial_records")
    .select(
      `
      *,
      students ( name, teacher_id ),
      class_logs ( id, class_date, attendance, grade, feedback, title )
    `
    )
    .in("student_id", studentIds)
    .order("due_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FinancialRecordWithRelations[];
}

async function fetchFinancialRecords(
  teacherId: string | null | undefined,
  page: number,
  pageSize: number,
  filters: FinancialRecordsFilters | undefined
): Promise<{ list: FinancialRecordWithRelations[]; count: number }> {
  const sortBy = filters?.sortBy ?? "created_desc";
  const orderCol = sortBy.startsWith("amount")
    ? "amount"
    : sortBy.startsWith("created")
      ? "created_at"
      : "due_date";
  const ascending =
    sortBy === "due_asc" || sortBy === "amount_asc" || sortBy === "created_asc";

  let q = supabase
    .from("financial_records")
    .select(
      `*,
      students!inner ( name, teacher_id ),
      class_logs ( id, class_date, attendance, grade, feedback, title ),
      confirmed_by:profiles!financial_records_confirmed_by_profiles_fkey ( full_name ),
      payment_proof_status, payment_proof_url, payment_proof_filename,
      payment_proof_uploaded_at, payment_proof_rejection_reason`,
      { count: "exact" }
    )
    .order(orderCol, { ascending });

  if (teacherId) q = q.eq("students.teacher_id", teacherId);
  if (filters?.studentId && filters.studentId !== "all")
    q = q.eq("student_id", filters.studentId);
  if (filters?.dateFrom) q = q.gte("due_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("due_date", filters.dateTo);

  const from = page * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;

  let list = (data ?? []) as FinancialRecordWithRelations[];

  const packageRecordIds = list
    .filter((r) => r.class_log_id === null)
    .map((r) => r.id);
  if (packageRecordIds.length > 0) {
    const { data: packageLinks, error: packageLinksError } = await supabase
      .from("financial_record_class_logs")
      .select(`financial_record_id, class_logs ( id, class_date, title )`)
      .in("financial_record_id", packageRecordIds);
    if (packageLinksError) throw packageLinksError;
    if (packageLinks) {
      const packageClassesMap = new Map<
        string,
        Array<{ id: string; class_date: string; title?: string | null }>
      >();
      packageLinks.forEach(
        (link: {
          financial_record_id: string;
          class_logs: {
            id: string;
            class_date: string;
            title: string | null;
          } | null;
        }) => {
          if (link.class_logs) {
            const existing =
              packageClassesMap.get(link.financial_record_id) || [];
            existing.push({
              id: link.class_logs.id,
              class_date: link.class_logs.class_date,
              title: link.class_logs.title,
            });
            packageClassesMap.set(link.financial_record_id, existing);
          }
        }
      );
      list = list.map((record) => ({
        ...record,
        package_classes: packageClassesMap.get(record.id) || undefined,
      }));
    }
  }

  return { list, count: count ?? 0 };
}

async function fetchFinancialSummary(teacherId?: string | null) {
  const { data, error } = await supabase.rpc("get_financial_summary", {
    p_teacher_id: teacherId ?? null,
  });
  if (error) throw error;

  const row = (data as typeof data)?.[0];
  return {
    totalPaid: Number(row?.total_paid) || 0,
    totalPending: Number(row?.total_pending) || 0,
    totalOverdue: Number(row?.total_overdue) || 0,
    totalReceivable: Number(row?.total_receivable) || 0,
    countPaid: Number(row?.count_paid) || 0,
    countPending: Number(row?.count_pending) || 0,
    countOverdue: Number(row?.count_overdue) || 0,
  };
}

// ---------------------------------------------------------------------------
// Mutation functions
// ---------------------------------------------------------------------------

async function createFinancialRecordFn(record: FinancialRecordInsert) {
  const rateLimitResult = checkRateLimit(
    "createFinancialRecord",
    RATE_LIMIT_CONFIGS.CRITICAL
  );
  if (!rateLimitResult.allowed) {
    throw new Error(
      `Muitas requisições. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
    );
  }
  const { error } = await supabase.from("financial_records").insert(record);
  if (error) throw error;
}

async function updateFinancialRecordFn({
  id,
  ...updates
}: FinancialRecordUpdate & { id: string }) {
  const { data, error } = await supabase
    .from("financial_records")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateFinancialStatusFn({
  id,
  status,
}: {
  id: string;
  status: "abonado" | "extornado";
}) {
  const { data, error } = await supabase
    .from("financial_records")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteFinancialRecordFn(id: string) {
  const rateLimitResult = checkRateLimit(
    "deleteFinancialRecord",
    RATE_LIMIT_CONFIGS.CRITICAL
  );
  if (!rateLimitResult.allowed) {
    throw new Error(
      `Muitas requisições. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
    );
  }
  const { error } = await supabase
    .from("financial_records")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Busca cobranças por lista de student_ids (ex.: para enriquecer lista paginada de alunos) */
export function useFinancialRecordsByStudentIds(studentIds: string[]) {
  return useQuery({
    queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS, studentIds],
    queryFn: () => fetchFinancialRecordsByStudentIds(studentIds),
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
    queryKey: [QK.FINANCIAL_RECORDS, teacherId, page, pageSize, filters],
    queryFn: () => fetchFinancialRecords(teacherId, page, pageSize, filters),
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as FinancialRecordWithRelations[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

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

export function useFinancialSummary(teacherId?: string | null) {
  return useQuery({
    queryKey: [QK.FINANCIAL_SUMMARY, teacherId],
    queryFn: () => fetchFinancialSummary(teacherId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFinancialRecordFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      toast.success("Cobrança criada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useCreateFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useMarkAsPaid() {
  const idempotencyKeyRef = { current: crypto.randomUUID() };

  return useOptimisticMutation<FinancialRecord, string>({
    mutationFn: async (id: string) => {
      const idempotencyKey = idempotencyKeyRef.current;

      const { data, error } = await supabase.rpc("mark_as_paid_idempotent", {
        p_record_id: id,
        p_payment_method: null,
        p_idempotency_key: idempotencyKey,
      });

      if (error) throw error;

      const { data: record, error: fetchError } = await supabase
        .from("financial_records")
        .select()
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      idempotencyKeyRef.current = crypto.randomUUID();

      return record;
    },
    queryKey: [QK.FINANCIAL_RECORDS],
    optimisticUpdate: (
      oldData: { list: FinancialRecordWithRelations[]; count: number },
      id: string
    ) => {
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

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = { current: crypto.randomUUID() };

  return useMutation({
    mutationFn: async (id: string) => {
      const idempotencyKey = idempotencyKeyRef.current;

      const { data, error } = await supabase.rpc("confirm_payment_idempotent", {
        p_record_id: id,
        p_idempotency_key: idempotencyKey,
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || "Erro ao confirmar pagamento");
      }

      idempotencyKeyRef.current = crypto.randomUUID();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      toast.success("Pagamento confirmado com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useConfirmPayment" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useUndoFinancialPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const idempotencyKey = crypto.randomUUID();

      const { data, error } = await supabase.rpc("undo_payment_idempotent", {
        p_record_id: id,
        p_idempotency_key: idempotencyKey,
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || "Erro ao desfazer pagamento");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      toast.success("Cobrança desfeita com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useUndoFinancialPayment" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useUpdateFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFinancialRecordFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      toast.success("Cobrança atualizada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useUpdateFinancialStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFinancialStatusFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      const message =
        variables.status === "abonado"
          ? "Falta abonada (não cobrada)"
          : "Pagamento extornado";
      toast.success(message);
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateFinancialStatus" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useDeleteFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFinancialRecordFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      toast.success("Cobrança removida com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useDeleteFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
