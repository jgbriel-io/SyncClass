import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BillingStatusConsolidated =
  | "not_billed"
  | "paid"
  | "pending"
  | "overdue"
  | "unknown";

export interface StudentStatementEntry {
  class_log_id: string;
  student_id: string;
  teacher_id: string | null;
  class_date: string;
  attendance: boolean | null;
  title: string | null;
  grade: number | null;
  feedback: string | null;
  created_at: string | null;
  financial_record_id: string | null;
  billed_amount: number | null;
  billing_status: string | null;
  billing_due_date: string | null;
  billing_paid_at: string | null;
  billing_status_consolidated: BillingStatusConsolidated;
  student_name: string | null;
  teacher_name: string | null;
}

export function useStudentStatement(studentId: string | null) {
  return useQuery({
    queryKey: ["student_statement", studentId],
    queryFn: async (): Promise<StudentStatementEntry[]> => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from("class_logs_with_billing")
        .select("*")
        .eq("student_id", studentId)
        .order("class_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as StudentStatementEntry[];
    },
    enabled: !!studentId,
  });
}
