import { useQuery } from "@tanstack/react-query";
import { QK } from "./queryKeys";
import { supabase } from "@/integrations/supabase/client";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import { format } from "date-fns";
import subMonths from "date-fns/subMonths";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import ptBR from "date-fns/locale/pt-BR";

interface DashboardStats {
  activeStudents: number;
  inactiveStudents: number;
  overdueCount: number;
  newStudentsThisMonth: number;
  classesThisMonth: number;
}

interface UpcomingPayment {
  id: string;
  studentName: string;
  amount: number;
  dueDate: string;
}

interface Birthday {
  id: string;
  name: string;
  birthDate: string;
}

export interface MonthlyChartData {
  month: string;
  count: number; // novos alunos
  classesCount: number; // aulas no mês
  teachersCount?: number; // novos professores (admin)
  usersCount?: number; // total usuários = alunos + professores (admin)
}

export function useDashboardStats() {
  return useQuery({
    queryKey: [QK.DASHBOARD_STATS],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Get students stats
      // Use students_masked para garantir mascaramento LGPD
      // (não afeta esta query pois não seleciona CPF/telefone)
      const { data: students, error: studentsError } = await supabase
        .from("students_masked")
        .select("id, status, created_at");

      if (studentsError) throw studentsError;

      const activeStudents =
        students?.filter((s) => s.status === "ativo").length || 0;
      const inactiveStudents =
        students?.filter((s) => s.status === "inativo").length || 0;
      const newStudentsThisMonth =
        students?.filter((s) => {
          const createdAt = new Date(s.created_at || "");
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length || 0;

      // Get overdue payments count
      const today = format(now, "yyyy-MM-dd");
      const { data: overdueRecords, error: overdueError } = await supabase
        .from("financial_records")
        .select("id")
        .neq("status", "pago")
        .lt("due_date", today);

      if (overdueError) throw overdueError;
      const overdueCount = overdueRecords?.length || 0;

      // Get classes this month
      const { data: classLogs, error: classesError } = await supabase
        .from("class_logs")
        .select("id")
        .gte("class_date", format(monthStart, "yyyy-MM-dd"))
        .lte("class_date", format(monthEnd, "yyyy-MM-dd"));

      if (classesError) throw classesError;
      const classesThisMonth = classLogs?.length || 0;

      return {
        activeStudents,
        inactiveStudents,
        overdueCount,
        newStudentsThisMonth,
        classesThisMonth,
      } as DashboardStats;
    },
  });
}

export function useUpcomingPayments() {
  return useQuery({
    queryKey: [QK.UPCOMING_PAYMENTS],
    queryFn: async () => {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data, error } = await supabase
        .from("financial_records")
        .select(
          `
          id,
          amount,
          due_date,
          students (
            name
          )
        `
        )
        .neq("status", "pago")
        .gte("due_date", format(today, "yyyy-MM-dd"))
        .lte("due_date", format(nextWeek, "yyyy-MM-dd"))
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      return (data || []).map((record) => ({
        id: record.id,
        studentName: record.students?.name || "—",
        amount: Number(record.amount),
        dueDate: record.due_date,
      })) as UpcomingPayment[];
    },
  });
}

export function useBirthdaysThisMonth() {
  return useQuery({
    queryKey: [QK.BIRTHDAYS_THIS_MONTH],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12

      // Use students_masked para garantir mascaramento LGPD
      // (não afeta esta query pois não seleciona CPF/telefone)
      const { data, error } = await supabase
        .from("students_masked")
        .select("id, name, birth_date")
        .eq("status", "ativo")
        .not("birth_date", "is", null);

      if (error) throw error;

      // Filter by birth month
      const birthdays = (data || [])
        .filter((student) => {
          if (!student.birth_date) return false;
          const birthMonth =
            new Date(student.birth_date + "T00:00:00").getMonth() + 1;
          return birthMonth === currentMonth;
        })
        .map((student) => ({
          id: student.id,
          name: student.name,
          birthDate: student.birth_date!,
        }))
        .sort((a, b) => {
          const dayA = new Date(a.birthDate + "T00:00:00").getDate();
          const dayB = new Date(b.birthDate + "T00:00:00").getDate();
          return dayA - dayB;
        })
        .slice(0, 5);

      return birthdays as Birthday[];
    },
  });
}

export function useNewStudentsByMonth(monthsBack: 1 | 3 | 6 | 12 = 6) {
  return useQuery({
    queryKey: [QK.NEW_STUDENTS_AND_CLASSES_BY_MONTH, monthsBack],
    queryFn: async () => {
      const [studentsRes, classesRes, teachersRes] = await Promise.all([
        supabase
          .from("students_masked")
          .select("created_at")
          .order("created_at", { ascending: true }),
        supabase.from("class_logs").select("class_date"),
        supabase.from("teachers").select("created_at"),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (teachersRes.error) throw teachersRes.error;

      const now = new Date();

      if (monthsBack === 1) {
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const months: MonthlyChartData[] = days.map((dayDate) => {
          const dayStart = new Date(dayDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayDate);
          dayEnd.setHours(23, 59, 59, 999);

          const count = (studentsRes.data || []).filter((student) => {
            const createdAt = new Date(student.created_at || "");
            return createdAt >= dayStart && createdAt <= dayEnd;
          }).length;

          const teachersCount = (teachersRes.data || []).filter((teacher) => {
            const createdAt = new Date(teacher.created_at || "");
            return createdAt >= dayStart && createdAt <= dayEnd;
          }).length;

          const classesCount = (classesRes.data || []).filter((log) => {
            const d = new Date(log.class_date + "T12:00:00");
            return d >= dayStart && d <= dayEnd;
          }).length;

          return {
            month: format(dayDate, "d", { locale: ptBR }),
            count,
            classesCount,
            teachersCount,
            usersCount: count + teachersCount,
          };
        });
        return months;
      }

      const months: MonthlyChartData[] = [];
      const n = monthsBack;

      for (let i = n - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthLabel = format(monthDate, "MMM", { locale: ptBR });

        const count = (studentsRes.data || []).filter((student) => {
          const createdAt = new Date(student.created_at || "");
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;

        const teachersCount = (teachersRes.data || []).filter((teacher) => {
          const createdAt = new Date(teacher.created_at || "");
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;

        const classesCount = (classesRes.data || []).filter((log) => {
          const d = new Date(log.class_date + "T12:00:00");
          return d >= monthStart && d <= monthEnd;
        }).length;

        months.push({
          month: monthLabel,
          count,
          classesCount,
          teachersCount,
          usersCount: count + teachersCount,
        });
      }

      return months;
    },
  });
}
