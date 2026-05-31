import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface StudentsStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newStudentsThisMonth: number;
}

/**
 * Hook para obter estatísticas gerais de alunos.
 *
 * @param teacherId - Se informado, filtra apenas alunos desse professor.
 */
export function useStudentsStats(teacherId?: string | null) {
  return useQuery({
    queryKey: [QK.STUDENTS_STATS, teacherId],
    queryFn: async (): Promise<StudentsStats> => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

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
        const createdDate = s.created_at.split("T")[0]; // YYYY-MM-DD
        return createdDate >= monthStart && createdDate <= monthEnd;
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
