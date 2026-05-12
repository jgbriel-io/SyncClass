import { supabase } from "@/integrations/supabase/client";
import { isOverdue } from "@/lib/utils/financialStatus";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import type {
  FinancialRecordInsert,
  FinancialRecordUpdate,
  FinancialRecordWithRelations,
  FinancialRecordsFilters,
} from "./useFinancialRecords";

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function fetchFinancialRecordsByStudentIds(
  studentIds: string[]
): Promise<FinancialRecordWithRelations[]> {
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
}

export async function fetchFinancialRecords(
  teacherId: string | null | undefined,
  page: number,
  pageSize: number,
  filters: FinancialRecordsFilters | undefined
): Promise<{ list: FinancialRecordWithRelations[]; count: number }> {
  const sortBy = filters?.sortBy ?? "created_desc";
  const orderCol =
    sortBy.startsWith("amount") ? "amount"
    : sortBy.startsWith("created") ? "created_at"
    : "due_date";
  const ascending = sortBy === "due_asc" || sortBy === "amount_asc" || sortBy === "created_asc";

  let q = supabase
    .from("financial_records")
    .select(
      `*,
      students!inner ( name, teacher_id ),
      class_logs ( id, class_date, attendance, grade, feedback, title ),
      payment_proof_status, payment_proof_url, payment_proof_filename,
      payment_proof_uploaded_at, payment_proof_rejection_reason`,
      { count: "exact" }
    )
    .order(orderCol, { ascending });

  if (teacherId) q = q.eq("students.teacher_id", teacherId);
  if (filters?.studentId && filters.studentId !== "all") q = q.eq("student_id", filters.studentId);
  if (filters?.dateFrom) q = q.gte("due_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("due_date", filters.dateTo);

  const from = page * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;

  let list = (data ?? []) as FinancialRecordWithRelations[];

  // Enriquecer com nomes de quem confirmou pagamento
  const confirmedByUserIds = Array.from(
    new Set(list.filter((r) => r.confirmed_by_user_id).map((r) => r.confirmed_by_user_id!))
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

  // Enriquecer cobranças de pacote com aulas vinculadas
  const packageRecordIds = list.filter((r) => r.class_log_id === null).map((r) => r.id);
  if (packageRecordIds.length > 0) {
    const { data: packageLinks } = await supabase
      .from("financial_record_class_logs")
      .select(`financial_record_id, class_logs ( id, class_date, title )`)
      .in("financial_record_id", packageRecordIds);
    if (packageLinks) {
      const packageClassesMap = new Map<string, Array<{ id: string; class_date: string; title?: string | null }>>();
      packageLinks.forEach((link: { financial_record_id: string; class_logs: { id: string; class_date: string; title: string | null } | null }) => {
        if (link.class_logs) {
          const existing = packageClassesMap.get(link.financial_record_id) || [];
          existing.push({ id: link.class_logs.id, class_date: link.class_logs.class_date, title: link.class_logs.title });
          packageClassesMap.set(link.financial_record_id, existing);
        }
      });
      list = list.map((record) => ({
        ...record,
        package_classes: packageClassesMap.get(record.id) || undefined,
      }));
    }
  }

  return { list, count: count ?? 0 };
}

export async function fetchFinancialSummary(teacherId?: string | null) {
  const { data, error } = await supabase
    .from("financial_records")
    .select("amount, status, due_date, students(teacher_id)");
  if (error) throw error;

  let records = (data || []) as Array<{ amount: number; status: string; due_date: string; students?: { teacher_id?: string } }>;
  if (teacherId) records = records.filter((r) => r.students?.teacher_id === teacherId);

  const summary = { totalPending: 0, totalPaid: 0, totalOverdue: 0, totalReceivable: 0, countPending: 0, countPaid: 0, countOverdue: 0 };
  records.forEach((record) => {
    const amount = Number(record.amount) || 0;
    if (record.status === "pago") {
      summary.totalPaid += amount;
      summary.countPaid++;
    } else if (isOverdue(record.due_date)) {
      summary.totalOverdue += amount;
      summary.countOverdue++;
    } else {
      summary.totalPending += amount;
      summary.countPending++;
    }
  });
  summary.totalReceivable = summary.totalPending + summary.totalOverdue;
  return summary;
}

// ---------------------------------------------------------------------------
// Mutation functions
// ---------------------------------------------------------------------------

export async function createFinancialRecordFn(record: FinancialRecordInsert) {
  const rateLimitResult = checkRateLimit("createFinancialRecord", RATE_LIMIT_CONFIGS.CRITICAL);
  if (!rateLimitResult.allowed) {
    throw new Error(`Muitas requisições. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`);
  }
  const { error } = await supabase.from("financial_records").insert(record);
  if (error) throw error;
}

export async function updateFinancialRecordFn({ id, ...updates }: FinancialRecordUpdate & { id: string }) {
  const { data, error } = await supabase
    .from("financial_records")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFinancialStatusFn({ id, status }: { id: string; status: "abonado" | "extornado" }) {
  const { data, error } = await supabase
    .from("financial_records")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFinancialRecordFn(id: string) {
  const rateLimitResult = checkRateLimit("deleteFinancialRecord", RATE_LIMIT_CONFIGS.CRITICAL);
  if (!rateLimitResult.allowed) {
    throw new Error(`Muitas requisições. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`);
  }
  const { error } = await supabase.from("financial_records").delete().eq("id", id);
  if (error) throw error;
}
