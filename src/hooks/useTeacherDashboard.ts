import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, addDays } from "date-fns";

export interface TeacherDashboardStats {
  activeStudents: number;
  overdueCount: number;
  newStudentsThisMonth: number;
  classesThisMonth: number;
}

export interface UpcomingPayment {
  id: string;
  studentName: string;
  dueDate: string;
  amount: number;
}

export interface Birthday {
  id: string;
  name: string;
  birthDate: string;
}

export interface MonthData {
  month: string;
  count: number;
}

interface FinancialRecordWithStudent {
  id: string;
  due_date: string;
  amount: number;
  students: {
    id: string;
    name: string;
    teacher_id: string | null;
  };
}

export function useTeacherDashboardStats(teacherId: string | null) {
  return useQuery({
    queryKey: ["teacher-dashboard-stats", teacherId],
    queryFn: async (): Promise<TeacherDashboardStats> => {
      if (!teacherId) {
        return {
          activeStudents: 0,
          overdueCount: 0,
          newStudentsThisMonth: 0,
          classesThisMonth: 0,
        };
      }

      // Active students
      const { count: activeCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo")
        .eq("teacher_id", teacherId);
      
      // First, get all student ids for this teacher
      const { data: teacherStudents, error: teacherStudentsError } = await supabase
        .from("students")
        .select("id")
        .eq("teacher_id", teacherId);

      if (teacherStudentsError) {
        throw teacherStudentsError;
      }

      const studentIds = (teacherStudents || []).map((s) => s.id);

      let overdueCount = 0;
      let classCount = 0;

      // New students this month
      const startMonth = startOfMonth(new Date()).toISOString();
      const endMonth = endOfMonth(new Date()).toISOString();

      const { count: newCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startMonth)
        .lte("created_at", endMonth)
        .eq("teacher_id", teacherId);

      if (studentIds.length > 0) {
        // Overdue students (based on financial_records: status = 'atrasado')
        const { count: overdue } = await supabase
          .from("financial_records")
          .select("id", { count: "exact", head: true })
          .eq("status", "atrasado")
          .in("student_id", studentIds);

        overdueCount = overdue || 0;

        // Classes this month for this teacher's students
        const { count: classes } = await supabase
          .from("class_logs")
          .select("id", { count: "exact", head: true })
          .gte("class_date", startMonth)
          .lte("class_date", endMonth)
          .in("student_id", studentIds);

        classCount = classes || 0;
      }

      return {
        activeStudents: activeCount || 0,
        overdueCount: overdueCount || 0,
        newStudentsThisMonth: newCount || 0,
        classesThisMonth: classCount || 0,
      };
    },
    enabled: !!teacherId,
  });
}

export function useTeacherUpcomingPayments(teacherId: string | null) {
  return useQuery({
    queryKey: ["teacher-upcoming-payments", teacherId],
    queryFn: async (): Promise<UpcomingPayment[]> => {
      if (!teacherId) return [];

      const today = new Date();
      const startDate = startOfWeek(today, { weekStartsOn: 0 }).toISOString().split("T")[0];
      const endDate = endOfWeek(addDays(today, 7), { weekStartsOn: 0 }).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("financial_records")
        .select(`
          id,
          due_date,
          amount,
          students!inner(id, name, teacher_id)
        `)
        .eq("status", "pendente")
        .gte("due_date", startDate)
        .lte("due_date", endDate)
        .eq("students.teacher_id", teacherId)
        .order("due_date", { ascending: true });

      if (error) throw error;

      return (data || []).map((record: FinancialRecordWithStudent) => ({
        id: record.id,
        studentName: record.students.name,
        dueDate: record.due_date,
        amount: record.amount,
      }));
    },
    enabled: !!teacherId,
  });
}

export function useTeacherBirthdaysThisMonth(teacherId: string | null) {
  return useQuery({
    queryKey: ["teacher-birthdays", teacherId],
    queryFn: async (): Promise<Birthday[]> => {
      if (!teacherId) return [];

      const today = new Date();
      const currentMonth = (today.getMonth() + 1).toString().padStart(2, "0");

      const { data, error } = await supabase
        .from("students")
        .select("id, name, birth_date")
        .eq("teacher_id", teacherId)
        .not("birth_date", "is", null)
        .order("birth_date", { ascending: true });

      if (error) throw error;

      return (data || []).map((student) => ({
        id: student.id,
        name: student.name,
        birthDate: student.birth_date!,
      }));
    },
    enabled: !!teacherId,
  });
}

export function useTeacherNewStudentsByMonth(teacherId: string | null) {
  return useQuery({
    queryKey: ["teacher-new-students-by-month", teacherId],
    queryFn: async (): Promise<MonthData[]> => {
      if (!teacherId) return [];

      const today = new Date();
      const months: MonthData[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const startMonth = startOfMonth(monthDate).toISOString();
        const endMonth = endOfMonth(monthDate).toISOString();

        const { count } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startMonth)
          .lte("created_at", endMonth)
          .eq("teacher_id", teacherId);

        months.push({
          month: format(monthDate, "MMM", { locale: { localize: { month: (n) => ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][n] } } }),
          count: count || 0,
        });
      }

      return months;
    },
    enabled: !!teacherId,
  });
}
