import React from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/security/errorHandler";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { financial as financialContent } from "@/content";
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
    deleted_at: string | null;
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
      confirmed_by:profiles!financial_records_confirmed_by_profiles_fkey ( full_name, deleted_at ),
      financial_record_class_logs ( class_logs ( id, class_date, title ) )`,
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

  const list = ((data ?? []) as FinancialRecordWithRelations[]).map(
    (record) => {
      const packageLinks = (
        record as unknown as {
          financial_record_class_logs: Array<{
            class_logs: {
              id: string;
              class_date: string;
              title: string | null;
            } | null;
          }> | null;
        }
      ).financial_record_class_logs;
      if (!packageLinks?.length) return record;
      const packageClasses = packageLinks
        .filter((l) => l.class_logs)
        .map((l) => ({
          id: l.class_logs!.id,
          class_date: l.class_logs!.class_date,
          title: l.class_logs!.title,
        }));
      return packageClasses.length
        ? { ...record, package_classes: packageClasses }
        : record;
    }
  );

  return { list, count: count ?? 0 };
}

async function fetchFinancialSummary(
  teacherId?: string | null,
  dateFrom?: string,
  dateTo?: string
) {
  const { data, error } = await supabase.rpc("get_financial_summary", {
    p_teacher_id: teacherId ?? null,
    p_date_from: dateFrom ?? null,
    p_date_to: dateTo ?? null,
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
  status: "abonado" | "extornado" | "cancelado";
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

export function useFinancialSummary(
  teacherId?: string | null,
  dateRange?: { from: string; to: string }
) {
  return useQuery({
    queryKey: [QK.FINANCIAL_SUMMARY, teacherId, dateRange?.from, dateRange?.to],
    queryFn: () =>
      fetchFinancialSummary(teacherId, dateRange?.from, dateRange?.to),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFinancialRecord() {
  const queryClient = useQueryClient();
  const mutationInFlight = useRef(false);
  return useMutation({
    mutationFn: async (
      record: Parameters<typeof createFinancialRecordFn>[0]
    ) => {
      if (mutationInFlight.current) throw new Error("Operação em andamento");
      mutationInFlight.current = true;
      try {
        return await createFinancialRecordFn(record);
      } finally {
        mutationInFlight.current = false;
      }
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
      toast.success(financialContent.formDialog.toasts.success);
    },
    onError: (error) => {
      logger.error(error, { context: "useCreateFinancialRecord" });
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
      toast.success(financialContent.formDialog.toasts.successEdit);
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useUpdateFinancialStatus() {
  const queryClient = useQueryClient();
  const mutationInFlight = useRef(false);
  return useMutation({
    mutationFn: async (
      variables: Parameters<typeof updateFinancialStatusFn>[0]
    ) => {
      if (mutationInFlight.current) throw new Error("Operação em andamento");
      mutationInFlight.current = true;
      try {
        return await updateFinancialStatusFn(variables);
      } finally {
        mutationInFlight.current = false;
      }
    },
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
          : variables.status === "cancelado"
            ? "Cobrança cancelada com sucesso."
            : "Pagamento extornado";
      toast.success(message);
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateFinancialStatus" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useRefundAbacatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      financialRecordId,
      reason,
    }: {
      financialRecordId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "refund-abacate-payment",
        { body: { financial_record_id: financialRecordId, reason } }
      );
      if (error) throw error;
      return data as { refundPublicId: string };
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
      toast.success(financialContent.refundDialog.toasts.successAbacate);
    },
    onError: (error) => {
      logger.error(error, { context: "useRefundAbacatePayment" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useCreateAbacatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      financialRecordId,
      cpf,
      cellphone,
    }: {
      financialRecordId: string;
      cpf: string;
      cellphone?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "create-abacate-payment",
        { body: { financial_record_id: financialRecordId, cpf, cellphone } }
      );
      if (error) throw error;
      return data as { brCode: string; expiresAt: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QK.STUDENT_FINANCIAL_RECORDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
    },
    onError: (error) => {
      logger.error(error, { context: "useCreateAbacatePayment" });
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
      toast.success(financialContent.deleteDialog.toasts.success);
    },
    onError: (error) => {
      logger.error(error, { context: "useDeleteFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
