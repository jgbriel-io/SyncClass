import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import subMonths from "date-fns/subMonths";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import ptBR from "date-fns/locale/pt-BR";
import startOfWeek from "date-fns/startOfWeek";
import endOfWeek from "date-fns/endOfWeek";
import addDays from "date-fns/addDays";

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
  classesCount: number;
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

      // Active students (excluindo alunos deletados via soft delete)
      const { count: activeCount } = await supabase
        .from("students_active")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo")
        .eq("teacher_id", teacherId);
      
      // First, get all student ids for this teacher (excluindo deletados)
      const { data: teacherStudents, error: teacherStudentsError } = await supabase
        .from("students_active")
        .select("id")
        .eq("teacher_id", teacherId);

      if (teacherStudentsError) {
        throw teacherStudentsError;
      }

      const studentIds = (teacherStudents || []).map((s) => s.id);

      let overdueCount = 0;
      let classCount = 0;

      // New students this month (excluindo deletados)
      const startMonth = startOfMonth(new Date()).toISOString();
      const endMonth = endOfMonth(new Date()).toISOString();

      const { count: newCount } = await supabase
        .from("students_active")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startMonth)
        .lte("created_at", endMonth)
        .eq("teacher_id", teacherId);

      if (studentIds.length > 0) {
        // Overdue = não pago e due_date < hoje (status no DB é "pendente", atrasado é derivado de due_date)
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const { count: overdue } = await supabase
          .from("financial_records")
          .select("id", { count: "exact", head: true })
          .neq("status", "pago")
          .lt("due_date", todayStr)
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

      // Use students_active_masked para mascaramento LGPD + excluir deletados
      // (não afeta esta query pois não seleciona CPF/telefone)
      const { data, error } = await supabase
        .from("students_active_masked")
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

export function useTeacherNewStudentsByMonth(teacherId: string | null, monthsBack: 1 | 3 | 6 | 12 = 6) {
  return useQuery({
    queryKey: ["teacher-new-students-and-classes-by-month", teacherId, monthsBack],
    queryFn: async (): Promise<MonthData[]> => {
      if (!teacherId) return [];

      const today = new Date();

      if (monthsBack === 1) {
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const startStr = monthStart.toISOString();
        const endStr = monthEnd.toISOString();

        const [studentsRes, classesRes] = await Promise.all([
          supabase
            .from("students_active")
            .select("created_at")
            .gte("created_at", startStr)
            .lte("created_at", endStr)
            .eq("teacher_id", teacherId),
          supabase
            .from("class_logs")
            .select("class_date")
            .eq("teacher_id", teacherId)
            .gte("class_date", startStr.split("T")[0])
            .lte("class_date", endStr.split("T")[0]),
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (classesRes.error) throw classesRes.error;

        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        return days.map((dayDate) => {
          const dayStart = new Date(dayDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayDate);
          dayEnd.setHours(23, 59, 59, 999);
          const dayStartStr = dayStart.toISOString();
          const dayEndStr = dayEnd.toISOString();
          const dayDateStr = format(dayDate, "yyyy-MM-dd");

          const count = (studentsRes.data || []).filter((s) => {
            const created = s.created_at;
            return created && created >= dayStartStr && created <= dayEndStr;
          }).length;

          const classesCount = (classesRes.data || []).filter((c) => c.class_date === dayDateStr).length;

          return {
            month: format(dayDate, "d"),
            count,
            classesCount,
          };
        });
      }

      const months: MonthData[] = [];
      const n = monthsBack;

      for (let i = n - 1; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const startMonth = startOfMonth(monthDate).toISOString();
        const endMonth = endOfMonth(monthDate).toISOString();

        const [studentsRes, classesRes] = await Promise.all([
          supabase
            .from("students_active")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startMonth)
            .lte("created_at", endMonth)
            .eq("teacher_id", teacherId),
          supabase
            .from("class_logs")
            .select("*", { count: "exact", head: true })
            .eq("teacher_id", teacherId)
            .gte("class_date", startMonth.split("T")[0])
            .lte("class_date", endMonth.split("T")[0]),
        ]);

        const count = studentsRes.count || 0;
        const classesCount = classesRes.count || 0;

        months.push({
          month: format(monthDate, "MMM", { locale: ptBR }),
          count,
          classesCount,
        });
      }

      return months;
    },
    enabled: !!teacherId,
  });
}
