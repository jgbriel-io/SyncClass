import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
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
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number | null;
  attendance: boolean | null;
  grade: number | null;
  feedback: string | null;
  title?: string | null;
  billed_amount?: number | null;
  teacher_id?: string | null;
  teacher_name?: string;
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
      // Use students_masked para garantir mascaramento LGPD
      // Nota: O aluno vê seus próprios dados mascarados por questão de conformidade
      const { data: student, error: studentError } = await supabase
        .from("students_masked")
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
      // First get the student_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("student_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.student_id) return [];

      // Student data: students_masked (aluno pode ler; teachers não)
      const { data: student, error: studentError } = await supabase
        .from("students_masked")
        .select("teacher_id")
        .eq("id", profile.student_id)
        .maybeSingle();

      if (studentError) throw studentError;

      let studentTeacherName: string | undefined;
      if (student?.teacher_id) {
        const { data: teacher } = await supabase
          .from("teachers_masked")
          .select("name")
          .eq("id", student.teacher_id)
          .maybeSingle();
        studentTeacherName = teacher?.name;
      }

      // Class logs com teachers_masked(name) por RLS
      const { data, error } = await supabase
        .from("class_logs")
        .select(`
          id,
          class_date,
          start_at,
          end_at,
          duration_minutes,
          attendance,
          grade,
          feedback,
          title,
          billed_amount,
          teacher_id,
          teachers_masked(name)
        `)
        .eq("student_id", profile.student_id)
        .order("class_date", { ascending: false });

      if (error) throw error;

      const mappedLogs = (data || []).map((log: Record<string, unknown> & { teachers_masked?: { name?: string } | null }) => {
        const logTeacherName = log.teachers_masked?.name ?? studentTeacherName;
        const logTeacherId = log.teacher_id ?? student?.teacher_id;
        return {
          id: log.id,
          class_date: log.class_date,
          start_at: log.start_at,
          end_at: log.end_at,
          duration_minutes: log.duration_minutes,
          attendance: log.attendance,
          grade: log.grade,
          feedback: log.feedback,
          title: log.title,
          billed_amount: log.billed_amount,
          teacher_id: logTeacherId,
          teacher_name: logTeacherName,
        };
      });

      return mappedLogs as StudentClassLog[];
    },
    enabled: !!user?.id,
  });
}

export function useStudentFinancialRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["student_financial_records", user?.id],
    queryFn: async () => {
      // First get the student_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("student_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.student_id) return [];

      // Then get the financial records for this student
      const { data, error } = await supabase
        .from("financial_records")
        .select("id, amount, due_date, description, status, paid_at")
        .eq("student_id", profile.student_id)
        .order("due_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((record) => ({
        ...record,
        status: getFinancialActualStatus(record),
      })) as StudentFinancialRecord[];
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
