import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Student = Tables<"students">;
export type StudentInsert = TablesInsert<"students">;
export type StudentUpdate = TablesUpdate<"students">;

export function useStudentsByTeacher(teacherId: string) {
  return useQuery({
    queryKey: ["students", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Student[];
    },
  });
}

export function useCreateStudentForTeacher(teacherId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: Omit<StudentInsert, "teacher_id">) => {
      const { data, error } = await supabase
        .from("students")
        .insert({ ...student, teacher_id: teacherId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", teacherId] });
      toast.success("Aluno cadastrado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating student:", error);
      toast.error("Erro ao cadastrar aluno. Tente novamente.");
    },
  });
}
