import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  getClassStatusWithTime,
  isClassOverlapError,
  CLASS_OVERLAP_MESSAGE,
  validateNoOverlap,
} from "@/lib/utils/classTime";
import { classes as classesContent } from "@/content";
import { QK } from "./queryKeys";
import {
  type PeriodFilter,
  getDateRangeForPeriod as getPeriodDateRange,
} from "@/lib/utils/periodFilter";

const DEFAULT_PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClassLogsStatusFilter =
  | "all"
  | "em_aberto"
  | "agendada"
  | "avaliacao_pendente"
  | "concluida";

export type ClassLogsFilters = {
  teacherId?: string;
  studentId?: string;
  period?: "all" | "week" | "month" | "3months";
  status?: ClassLogsStatusFilter;
  sort?: "recent" | "oldest";
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
    status:
      | "pendente"
      | "pago"
      | "atrasado"
      | "abonado"
      | "extornado"
      | "cancelado"
      | null;
    amount: number;
    due_date: string;
    description?: string | null;
  }>;
  financial_record_class_logs?: Array<{
    financial_records: {
      id: string;
      status:
        | "pendente"
        | "pago"
        | "atrasado"
        | "abonado"
        | "extornado"
        | "cancelado"
        | null;
      amount: number;
      due_date: string;
      description?: string | null;
    };
  }>;
  /** true quando a cobrança foi vinculada via pacote (financial_record_class_logs) */
  financial_record_via_package?: boolean;
  /** total de aulas no pacote (calculado client-side, limitado à página atual) */
  package_count?: number;
  /** primeira e última data do pacote (calculado client-side, limitado à página atual) */
  package_date_range?: { first: string; last: string };
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

export type UpdateClassLogPayload = ClassLogUpdate & {
  id: string;
  financialRecordId?: string;
  dueDate?: string;
  amount?: number;
};

export interface CreateClassLogPackageItem {
  classLog: ClassLogInsert;
}

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

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateRangeForPeriod(period: "week" | "month" | "3months"): {
  from: string;
  to: string;
} {
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
    from: toLocalDateStr(from),
    to: toLocalDateStr(to),
  };
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

const CLASS_LOG_SELECT = `
  *,
  students!inner ( name, teacher_id ),
  teachers ( name ),
  financial_records (
    id, status, amount, due_date
  ),
  financial_record_class_logs (
    financial_record_id,
    financial_records (
      id, status, amount, due_date, description
    )
  )
`;

type PackageLink = {
  financial_record_id: string;
  financial_records: ClassLogWithStudent["financial_records"][number] | null;
};

function enrichWithPackageFinancial(
  list: ClassLogWithStudent[]
): ClassLogWithStudent[] {
  // Pre-scan: build map financial_record_id → sorted class_dates[]
  const packageDates = new Map<string, string[]>();
  for (const log of list) {
    const links = (log as Record<string, unknown>)
      .financial_record_class_logs as PackageLink[] | null;
    const frId = links?.[0]?.financial_record_id;
    if (frId) {
      const existing = packageDates.get(frId) ?? [];
      packageDates.set(frId, [...existing, log.class_date]);
    }
  }

  return list.map((log) => {
    if (log.financial_records && log.financial_records.length > 0) return log;
    const packageLinks = (log as Record<string, unknown>)
      .financial_record_class_logs as PackageLink[] | null;
    if (!packageLinks?.length) return log;
    const frId = packageLinks[0]?.financial_record_id;
    const fr = packageLinks[0]?.financial_records;
    if (fr) {
      const dates = frId ? (packageDates.get(frId) ?? []) : [];
      const sorted = [...dates].sort();
      return {
        ...log,
        financial_records: [fr],
        financial_record_via_package: true,
        package_count: dates.length || undefined,
        package_date_range:
          sorted.length > 0
            ? { first: sorted[0], last: sorted[sorted.length - 1] }
            : undefined,
      };
    }
    return log;
  });
}

async function fetchClassLogs(
  teacherId: string | undefined,
  page: number,
  pageSize: number,
  filters: ClassLogsFilters | undefined
): Promise<{ list: ClassLogWithStudent[]; count: number }> {
  const ascending = filters?.sort === "oldest";
  let q = supabase
    .from("class_logs")
    .select(CLASS_LOG_SELECT, { count: "exact" })
    .order("class_date", { ascending });

  const effectiveTeacherId =
    teacherId ??
    (filters?.teacherId !== "all" ? filters?.teacherId : undefined);

  if (effectiveTeacherId) {
    q = q.eq("students.teacher_id", effectiveTeacherId);
  }

  if (filters?.studentId && filters.studentId !== "all")
    q = q.eq("student_id", filters.studentId);
  if (filters?.period && filters.period !== "all") {
    const { from, to } = getDateRangeForPeriod(filters.period);
    q = q.gte("class_date", from).lte("class_date", to);
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (filters?.status && filters.status !== "all") {
    if (filters.status === "em_aberto") {
      q = q.is("attendance", null);
    } else if (filters.status === "agendada") {
      q = q.gt("class_date", todayStr);
    } else if (filters.status === "avaliacao_pendente") {
      q = q.is("attendance", null).lte("class_date", todayStr);
    } else if (filters.status === "concluida") {
      q = q.not("attendance", "is", null);
    }
  }

  const from = page * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;
  const list = enrichWithPackageFinancial(
    (data ?? []) as ClassLogWithStudent[]
  );
  return { list, count: count ?? 0 };
}

async function fetchClassLogsByStudentIds(
  studentIds: string[]
): Promise<ClassLogWithStudent[]> {
  const { data, error } = await supabase
    .from("class_logs")
    .select(CLASS_LOG_SELECT)
    .in("student_id", studentIds)
    .order("class_date", { ascending: false });
  if (error) throw error;
  return enrichWithPackageFinancial((data ?? []) as ClassLogWithStudent[]);
}

async function fetchPendingEvaluationClassLogs(): Promise<
  ClassLogWithStudent[]
> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateStr(today);
  const { data, error } = await supabase
    .from("class_logs")
    .select(
      `*, students ( name, teacher_id ), teachers ( name ), financial_records ( id, status, amount, due_date )`
    )
    .is("attendance", null)
    .lte("class_date", todayStr)
    .order("class_date", { ascending: false })
    .limit(50);
  if (error) throw error;
  const list = (data ?? []) as ClassLogWithStudent[];
  const enriched = enrichWithPackageFinancial(list);
  return enriched.filter(
    (log) => getClassStatusWithTime(log).label === "Pendente"
  );
}

async function fetchAvailableClassLogsForStudent(studentId: string) {
  const [
    { data: classLogs, error: classLogsError },
    { data: financialRecords, error: financialError },
  ] = await Promise.all([
    supabase
      .from("class_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("class_date", { ascending: false }),
    supabase
      .from("financial_records")
      .select("class_log_id")
      .eq("student_id", studentId)
      .not("class_log_id", "is", null),
  ]);
  if (classLogsError) throw classLogsError;
  if (financialError) throw financialError;

  const usedClassLogIds = new Set(
    financialRecords?.map((r) => r.class_log_id).filter(Boolean) || []
  );

  const { data: packageLinks, error: packageLinksError } = await supabase
    .from("financial_record_class_logs")
    .select("class_log_id")
    .in("class_log_id", classLogs?.map((l) => l.id) ?? []);
  if (packageLinksError) throw packageLinksError;
  packageLinks?.forEach((r) => usedClassLogIds.add(r.class_log_id));

  return classLogs?.filter((log) => !usedClassLogIds.has(log.id)) || [];
}

async function fetchClassLogsSummary(
  teacherId?: string | null,
  dateFrom?: string,
  dateTo?: string
) {
  const { data, error } = await supabase.rpc("get_class_logs_summary", {
    p_teacher_id: teacherId ?? null,
    p_date_from: dateFrom ?? null,
    p_date_to: dateTo ?? null,
  });
  if (error) throw error;
  const row = data as {
    totalClasses: number;
    totalPresent: number;
    totalAbsent: number;
    totalPending: number;
    gradesCount: number;
    gradesSum: number;
    averageGrade: number;
  } | null;
  return {
    totalClasses: Number(row?.totalClasses) || 0,
    totalPresent: Number(row?.totalPresent) || 0,
    totalAbsent: Number(row?.totalAbsent) || 0,
    totalPending: Number(row?.totalPending) || 0,
    averageGrade: Number(row?.averageGrade) || 0,
    gradesCount: Number(row?.gradesCount) || 0,
    gradesSum: Number(row?.gradesSum) || 0,
  };
}

async function recalculateAndUpdatePackageFinancial(
  packageFinancialRecordId: string,
  dueDate?: string
): Promise<void> {
  const { data: packageLinks, error: linksError } = await supabase
    .from("financial_record_class_logs")
    .select("class_log_id")
    .eq("financial_record_id", packageFinancialRecordId);
  if (linksError) throw linksError;

  const classLogIds = packageLinks?.map((l) => l.class_log_id) || [];
  const { data: packageClasses, error: classesError } = await supabase
    .from("class_logs")
    .select("duration_minutes, student_id")
    .in("id", classLogIds);
  if (classesError) throw classesError;

  if (!packageClasses?.length) return;

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("hourly_rate")
    .eq("id", packageClasses[0].student_id)
    .single();
  if (studentError) throw studentError;

  const totalMinutes = packageClasses.reduce(
    (sum, cls) => sum + (cls.duration_minutes || 0),
    0
  );
  if (student?.hourly_rate == null) return;
  const newAmount = (totalMinutes / 60) * student.hourly_rate;

  const updatePayload: { amount: number; due_date?: string } = {
    amount: newAmount,
  };
  if (dueDate !== undefined) updatePayload.due_date = dueDate;

  const { error: updateError } = await supabase
    .from("financial_records")
    .update(updatePayload)
    .eq("id", packageFinancialRecordId);
  if (updateError) throw updateError;
}

async function applyFinancialRecordUpdate(
  financialRecordId: string,
  dueDate?: string,
  amount?: number
): Promise<void> {
  const update: { due_date?: string; amount?: number } = {};
  if (dueDate !== undefined) update.due_date = dueDate;
  if (amount != null && amount > 0) update.amount = amount;
  if (!Object.keys(update).length) return;
  const { error } = await supabase
    .from("financial_records")
    .update(update)
    .eq("id", financialRecordId);
  if (error) throw error;
}

async function createClassLogFn(log: ClassLogInsert) {
  const { data, error } = await supabase
    .from("class_logs")
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteClassLogFn(id: string) {
  await supabase.from("financial_records").delete().eq("class_log_id", id);
  const { error } = await supabase.from("class_logs").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useClassLogs(
  teacherId?: string,
  options?: UseClassLogsOptions
): UseClassLogsResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: [QK.CLASS_LOGS, teacherId, page, pageSize, filters],
    queryFn: () => fetchClassLogs(teacherId, page, pageSize, filters),
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as ClassLogWithStudent[];
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

export function useClassLogsByStudentIds(studentIds: string[]) {
  return useQuery({
    queryKey: [QK.CLASS_LOGS_BY_STUDENT_IDS, studentIds],
    queryFn: () => fetchClassLogsByStudentIds(studentIds),
    enabled: studentIds.length > 0,
  });
}

/** Aulas em aberto para avaliação. RLS já restringe ao professor; filtrar por teacher_id excluiria aulas com teacher_id nulo. */
export function usePendingEvaluationClassLogs(teacherId?: string | null) {
  return useQuery({
    queryKey: [QK.CLASS_LOGS_PENDING_EVALUATION, teacherId],
    queryFn: fetchPendingEvaluationClassLogs,
  });
}

export function useAvailableClassLogsForStudent(
  studentId: string | null,
  teacherId?: string
) {
  return useQuery({
    queryKey: [QK.AVAILABLE_CLASS_LOGS, studentId, teacherId],
    queryFn: () => fetchAvailableClassLogsForStudent(studentId!),
    enabled: !!studentId,
  });
}

export function useClassLogsSummary(
  teacherId?: string | null,
  period?: PeriodFilter
) {
  return useQuery({
    queryKey: [QK.CLASS_LOGS_SUMMARY, teacherId, period],
    queryFn: () => {
      if (period) {
        const { from, to } = getPeriodDateRange(period);
        return fetchClassLogsSummary(teacherId, from, to);
      }
      return fetchClassLogsSummary(teacherId);
    },
  });
}

export function useCreateClassLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClassLogFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS_SUMMARY] });
      toast.success(classesContent.logFormDialog.toasts.success);
    },
    onError: (error) => {
      toast.error(
        isClassOverlapError(error)
          ? CLASS_OVERLAP_MESSAGE
          : "Erro ao registrar aula. Tente novamente."
      );
    },
  });
}

export function useCreateClassLogWithFinancial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classLog,
      createFinancial,
      financialData,
    }: ClassLogWithFinancialData) => {
      const { data: createdLog, error: logError } = await supabase
        .from("class_logs")
        .insert(classLog)
        .select()
        .single();

      if (logError) throw logError;

      if (createFinancial && financialData) {
        const [y, m, d] = (classLog.class_date || "").split("-");
        const defaultDescription =
          y && m && d
            ? `Aula do dia ${d}/${m}/${y}`
            : `Aula do dia ${classLog.class_date || ""}`;
        const description =
          typeof financialData.description === "string" &&
          financialData.description.trim()
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
            record_type: "avulsa",
          });

        if (financialError) {
          toast.error(
            "Aula criada com sucesso, mas não foi possível criar a cobrança."
          );
          return createdLog;
        }
      }

      return createdLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.AVAILABLE_CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });

      if (variables.createFinancial) {
        toast.success(classesContent.logFormDialog.toasts.successWithPayment);
      } else {
        toast.success(classesContent.logFormDialog.toasts.success);
      }
    },
    onError: (error) => {
      toast.error(
        isClassOverlapError(error)
          ? CLASS_OVERLAP_MESSAGE
          : "Erro ao registrar aula. Tente novamente."
      );
    },
  });
}

async function fetchPackageLinkForClassLog(
  classLogId: string
): Promise<{ financial_record_id: string } | null> {
  const { data, error } = await supabase
    .from("financial_record_class_logs")
    .select("financial_record_id")
    .eq("class_log_id", classLogId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function applyClassLogFinancialUpdate(
  financialRecordId: string,
  packageLink: { financial_record_id: string } | null,
  dueDate: string | undefined,
  amount: number | undefined,
  durationMinutesChanged: boolean
): Promise<void> {
  if (packageLink?.financial_record_id && durationMinutesChanged) {
    await recalculateAndUpdatePackageFinancial(
      packageLink.financial_record_id,
      dueDate
    );
  } else {
    await applyFinancialRecordUpdate(financialRecordId, dueDate, amount);
  }
}

export function useUpdateClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      financialRecordId,
      dueDate,
      amount,
      ...updates
    }: UpdateClassLogPayload) => {
      const packageLink = await fetchPackageLinkForClassLog(id);

      const { data, error } = await supabase
        .from("class_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (financialRecordId) {
        await applyClassLogFinancialUpdate(
          financialRecordId,
          packageLink,
          dueDate,
          amount,
          updates.duration_minutes !== undefined
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS_SUMMARY] });
      queryClient.invalidateQueries({
        queryKey: [QK.CLASS_LOGS_PENDING_EVALUATION],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      toast.success(classesContent.logFormDialog.toasts.successEdit);
    },
    onError: (error) => {
      toast.error(
        isClassOverlapError(error)
          ? CLASS_OVERLAP_MESSAGE
          : "Erro ao atualizar registro. Tente novamente."
      );
    },
  });
}

export function useCreateClassLogPackage() {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: async (payload: CreateClassLogPackagePayload) => {
      const { items, packageFinancial } = payload;
      if (items.length === 0) throw new Error("Nenhuma aula no pacote.");

      validateNoOverlap(items);

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
      const idempotencyKey = idempotencyKeyRef.current;

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
            description:
              packageFinancial.description?.trim() ||
              `Pacote mensal - ${items.length} aulas`,
            payment_method: packageFinancial.payment_method || null,
          }
        : {
            amount: 0,
            due_date: null,
            description: null,
            payment_method: null,
          };

      if (packageFinancial) {
        if (packageFinancial.amount == null || packageFinancial.amount < 0) {
          throw new Error("Valor do pacote inválido");
        }
        if (
          !packageFinancial.due_date ||
          !/^\d{4}-\d{2}-\d{2}$/.test(packageFinancial.due_date)
        ) {
          throw new Error("Data de vencimento inválida");
        }
      }

      const { data, error } = await supabase.rpc("create_class_package", {
        p_class_logs: classLogs,
        p_financial_data: financialData,
        p_idempotency_key: idempotencyKey,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      idempotencyKeyRef.current = null;

      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS_SUMMARY] });
      queryClient.invalidateQueries({
        queryKey: [QK.CLASS_LOGS_PENDING_EVALUATION],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.AVAILABLE_CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });

      toast.success(
        data.message ||
          `${variables.items.length} aula(s) registrada(s) com sucesso!`
      );
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;

      const err = error as Error & { details?: string };
      const msg = err?.message || "";
      const details = err?.details ? ` (${err.details})` : "";
      const displayMsg = isClassOverlapError(error)
        ? msg
        : msg
          ? `${msg}${details}`
          : "Não foi possível cadastrar o pacote de aulas. Por favor, tente novamente.";
      toast.error(displayMsg);
    },
  });
}

export function useDeleteClassLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClassLogFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS] });
      queryClient.invalidateQueries({ queryKey: [QK.CLASS_LOGS_SUMMARY] });
      queryClient.invalidateQueries({
        queryKey: [QK.CLASS_LOGS_PENDING_EVALUATION],
      });
      queryClient.invalidateQueries({ queryKey: [QK.FINANCIAL_RECORDS] });
      queryClient.invalidateQueries({
        queryKey: [QK.FINANCIAL_RECORDS_BY_STUDENT_IDS],
      });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_DETAILS] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_BALANCE] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENT_STATEMENT] });
      toast.success(classesContent.logFormDialog.toasts.successDelete);
    },
    onError: () => {
      toast.error(
        "Não foi possível remover o registro. Por favor, tente novamente."
      );
    },
  });
}
