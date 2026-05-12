import { supabase } from "@/integrations/supabase/client";
import type { Teacher, TeachersListFilters } from "./useTeachers";

function maskCpf(teacher: Teacher): Teacher {
  return {
    ...teacher,
    cpf: teacher.cpf ? teacher.cpf.slice(0, -4).replace(/\d/g, "*") + teacher.cpf.slice(-4) : null,
  };
}

export async function fetchTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(maskCpf) as Teacher[];
}

export async function fetchTeachersPaginated(
  page: number,
  pageSize: number,
  filters: TeachersListFilters | undefined
): Promise<{ list: Teacher[]; count: number }> {
  let q = supabase.from("teachers").select("*", { count: "exact" });
  if (filters?.status && filters.status !== "all") q = q.eq("status", filters.status);
  q = q.order("name", { ascending: filters?.sortBy === "name_asc" });
  const from = page * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;
  return { list: (data ?? []).map(maskCpf) as Teacher[], count: count ?? 0 };
}
