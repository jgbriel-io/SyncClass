import { supabase } from "@/integrations/supabase/client";
import { getClassStatusWithTime } from "@/lib/utils/classTime";
import type { ClassLogInsert, ClassLogWithStudent, ClassLogsFilters } from "./useClassLogs";

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

export function getDateRangeForPeriod(period: "week" | "month" | "3months"): { from: string; to: string } {
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

export function validateNoOverlap(items: Array<{ classLog: ClassLogInsert }>): void {
  if (items.length <= 1) return;
  const byDate = new Map<string, Array<{ classLog: ClassLogInsert }>>();
  items.forEach((item) => {
    const date = item.classLog.class_date;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(item);
  });
  byDate.forEach((dayItems, date) => {
    if (dayItems.length <= 1) return;
    const sorted = dayItems.sort((a, b) =>
      (a.classLog.start_at || "").localeCompare(b.classLog.start_at || "")
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i].classLog;
      const next = sorted[i + 1].classLog;
      if ((current.end_at || "") > (next.start_at || "")) {
        const [yr, mo, dy] = date.split("-");
        throw new Error(
          `Aulas se sobrepõem no dia ${dy}/${mo}/${yr}: ${current.start_at}-${current.end_at} e ${next.start_at}-${next.end_at}`
        );
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Enriquecimento com financial de pacote
// ---------------------------------------------------------------------------

const CLASS_LOG_SELECT = `
  *,
  students ( name, teacher_id ),
  teachers ( name ),
  financial_records (
    id, status, amount, due_date,
    payment_proof_url, payment_proof_filename, payment_proof_status
  ),
  financial_record_class_logs (
    financial_record_id,
    financial_records (
      id, status, amount, due_date,
      payment_proof_url, payment_proof_filename, payment_proof_status
    )
  )
`;

export async function enrichWithPackageFinancial(
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
      log.financial_records = [fr];
      log.financial_record_via_package = true;
    }
  });
  return list;
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function fetchClassLogs(
  teacherId: string | undefined,
  page: number,
  pageSize: number,
  filters: ClassLogsFilters | undefined
): Promise<{ list: ClassLogWithStudent[]; count: number }> {
  let q = supabase
    .from("class_logs")
    .select(CLASS_LOG_SELECT, { count: "exact" })
    .order("class_date", { ascending: false });

  const effectiveTeacherId = teacherId ?? (filters?.teacherId !== "all" ? filters?.teacherId : undefined);

  if (effectiveTeacherId) {
    const { data: teacherStudentIds } = await supabase
      .from("students")
      .select("id")
      .eq("teacher_id", effectiveTeacherId);
    if (teacherStudentIds && teacherStudentIds.length > 0) {
      q = q.in("student_id", teacherStudentIds.map((s) => s.id));
    } else {
      return { list: [], count: 0 };
    }
  }

  if (filters?.studentId && filters.studentId !== "all") q = q.eq("student_id", filters.studentId);
  if (filters?.period && filters.period !== "all") {
    const { from, to } = getDateRangeForPeriod(filters.period);
    q = q.gte("class_date", from).lte("class_date", to);
  }

  const from = page * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;
  const list = (data ?? []) as ClassLogWithStudent[];
  await enrichWithPackageFinancial(list);
  return { list, count: count ?? 0 };
}

export async function fetchClassLogsByStudentIds(studentIds: string[]): Promise<ClassLogWithStudent[]> {
  const { data, error } = await supabase
    .from("class_logs")
    .select(`*, students ( name, teacher_id ), teachers ( name ), financial_records ( id, status, amount, due_date, payment_proof_url, payment_proof_filename, payment_proof_status )`)
    .in("student_id", studentIds)
    .order("class_date", { ascending: false });
  if (error) throw error;
  return enrichWithPackageFinancial((data ?? []) as ClassLogWithStudent[]);
}

export async function fetchPendingEvaluationClassLogs(): Promise<ClassLogWithStudent[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("class_logs")
    .select(`*, students ( name, teacher_id ), teachers ( name ), financial_records ( id, status, amount, due_date, payment_proof_url, payment_proof_filename, payment_proof_status )`)
    .is("attendance", null)
    .lte("class_date", todayStr)
    .order("class_date", { ascending: false })
    .limit(50);
  if (error) throw error;
  const list = (data ?? []) as ClassLogWithStudent[];
  const enriched = await enrichWithPackageFinancial(list);
  return enriched.filter((log) => getClassStatusWithTime(log).label === "Pendente");
}

export async function fetchAvailableClassLogsForStudent(studentId: string) {
  const { data: classLogs, error: classLogsError } = await supabase
    .from("class_logs")
    .select("*")
    .eq("student_id", studentId)
    .order("class_date", { ascending: false });
  if (classLogsError) throw classLogsError;

  const { data: financialRecords, error: financialError } = await supabase
    .from("financial_records")
    .select("class_log_id")
    .eq("student_id", studentId)
    .not("class_log_id", "is", null);
  if (financialError) throw financialError;

  const usedClassLogIds = new Set(financialRecords?.map((r) => r.class_log_id).filter(Boolean) || []);

  const { data: packageLinks } = await supabase
    .from("financial_record_class_logs")
    .select("class_log_id")
    .in("class_log_id", classLogs?.map((l) => l.id) ?? []);
  packageLinks?.forEach((r) => usedClassLogIds.add(r.class_log_id));

  return classLogs?.filter((log) => !usedClassLogIds.has(log.id)) || [];
}

export async function fetchClassLogsSummary(teacherId?: string | null) {
  let query = supabase.from("class_logs").select("attendance, grade");
  if (teacherId) {
    const { data: teacherStudentIds } = await supabase
      .from("students")
      .select("id")
      .eq("teacher_id", teacherId);
    if (teacherStudentIds && teacherStudentIds.length > 0) {
      query = query.in("student_id", teacherStudentIds.map((s) => s.id));
    } else {
      return { totalClasses: 0, totalPresent: 0, totalAbsent: 0, averageGrade: 0, gradesCount: 0, gradesSum: 0 };
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  const summary = { totalClasses: data.length, totalPresent: 0, totalAbsent: 0, averageGrade: 0, gradesCount: 0, gradesSum: 0 };
  data.forEach((log) => {
    if (log.attendance) summary.totalPresent++;
    else summary.totalAbsent++;
    if (log.grade !== null) { summary.gradesSum += Number(log.grade); summary.gradesCount++; }
  });
  if (summary.gradesCount > 0) summary.averageGrade = summary.gradesSum / summary.gradesCount;
  return summary;
}

// ---------------------------------------------------------------------------
// Mutation functions simples
// ---------------------------------------------------------------------------

export async function createClassLogFn(log: ClassLogInsert) {
  const { data, error } = await supabase.from("class_logs").insert(log).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClassLogFn(id: string) {
  await supabase.from("financial_records").delete().eq("class_log_id", id);
  const { error } = await supabase.from("class_logs").delete().eq("id", id);
  if (error) throw error;
}
