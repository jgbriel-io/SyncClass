import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StudentProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface StudentClassLog {
  id: string;
  class_date: string;
  attendance: boolean | null;
  grade: number | null;
  feedback: string | null;
}

interface StudentFinancialRecord {
  id: string;
  amount: number;
  due_date: string;
  description: string | null;
  status: "pendente" | "pago" | "atrasado";
  paid_at: string | null;
}

interface StudentStats {
  totalClasses: number;
  attendanceRate: number;
  averageGrade: number;
  totalPaid: number;
  totalPending: number;
  hasPendingPayments: boolean;
}

export function useStudentProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student_profile", user?.id],
    queryFn: async () => {
      // First get the student_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("student_id, full_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.student_id) return null;

      // Then get the student data
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, name, email, phone")
        .eq("id", profile.student_id)
        .maybeSingle();

      if (studentError) throw studentError;

      return student as StudentProfile | null;
    },
    enabled: !!user?.id,
  });
}

export function useStudentClassLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student_class_logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_logs")
        .select("id, class_date, attendance, grade, feedback")
        .order("class_date", { ascending: false });

      if (error) throw error;

      return (data || []) as StudentClassLog[];
    },
    enabled: !!user?.id,
  });
}

export function useStudentFinancialRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student_financial_records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_records")
        .select("id, amount, due_date, description, status, paid_at")
        .order("due_date", { ascending: false });

      if (error) throw error;

      // Calculate actual status based on due_date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return (data || []).map((record) => {
        let actualStatus = record.status as "pendente" | "pago" | "atrasado";
        if (record.status !== "pago") {
          const dueDate = new Date(record.due_date + "T00:00:00");
          if (dueDate < today) {
            actualStatus = "atrasado";
          } else {
            actualStatus = "pendente";
          }
        }
        return {
          ...record,
          status: actualStatus,
        };
      }) as StudentFinancialRecord[];
    },
    enabled: !!user?.id,
  });
}

export function useStudentStats() {
  const { data: classLogs = [] } = useStudentClassLogs();
  const { data: financialRecords = [] } = useStudentFinancialRecords();

  const stats: StudentStats = {
    totalClasses: classLogs.length,
    attendanceRate: 0,
    averageGrade: 0,
    totalPaid: 0,
    totalPending: 0,
    hasPendingPayments: false,
  };

  // Calculate attendance rate
  if (classLogs.length > 0) {
    const presentCount = classLogs.filter((log) => log.attendance).length;
    stats.attendanceRate = (presentCount / classLogs.length) * 100;
  }

  // Calculate average grade
  const gradesWithValue = classLogs.filter((log) => log.grade !== null);
  if (gradesWithValue.length > 0) {
    const sum = gradesWithValue.reduce((acc, log) => acc + (log.grade || 0), 0);
    stats.averageGrade = sum / gradesWithValue.length;
  }

  // Calculate financial stats
  financialRecords.forEach((record) => {
    const amount = Number(record.amount) || 0;
    if (record.status === "pago") {
      stats.totalPaid += amount;
    } else {
      stats.totalPending += amount;
      stats.hasPendingPayments = true;
    }
  });

  return stats;
}

export function useLastClass() {
  const { data: classLogs = [] } = useStudentClassLogs();
  
  if (classLogs.length === 0) return null;
  
  // Get the most recent class with attendance
  const lastClass = classLogs.find((log) => log.attendance);
  return lastClass || classLogs[0];
}
