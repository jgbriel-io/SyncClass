import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import {
  type PeriodFilter,
  getDateRangeForPeriod,
} from "@/lib/utils/periodFilter";

export interface StudentsStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newStudentsThisMonth: number;
}

export function useStudentsStats(
  teacherId?: string | null,
  period: PeriodFilter = "month"
) {
  return useQuery({
    queryKey: [QK.STUDENTS_STATS, teacherId, period],
    queryFn: async (): Promise<StudentsStats> => {
      const { from, to } = getDateRangeForPeriod(period);

      let query = supabase
        .from("students")
        .select("id, status, created_at")
        .eq("is_deleted", false);

      if (teacherId) {
        query = query.eq("teacher_id", teacherId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const students = data || [];

      const totalStudents = students.length;
      const activeStudents = students.filter(
        (s) => s.status === "ativo"
      ).length;
      const inactiveStudents = students.filter(
        (s) => s.status === "inativo"
      ).length;
      const newStudentsThisMonth = students.filter((s) => {
        if (!s.created_at) return false;
        const createdDate = s.created_at.split("T")[0];
        return createdDate >= from && createdDate <= to;
      }).length;

      return {
        totalStudents,
        activeStudents,
        inactiveStudents,
        newStudentsThisMonth,
      };
    },
  });
}
