import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Student = Tables<"students">;
export type StudentInsert = TablesInsert<"students">;
export type StudentUpdate = TablesUpdate<"students">;

export function useStudentsByTeacher() {
  // RLS garante que o professor veja apenas seus próprios alunos,
  // e o admin veja todos os alunos.
  // Use students_masked para mascarar CPF e telefone conforme LGPD
  return useQuery({
    queryKey: ["students", "by-teacher"],
    queryFn: async () => {
      const { data, error} = await supabase
        .from("students_masked")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Student[];
    },
  });
}

export function useCreateStudentForTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: Omit<StudentInsert, "teacher_id">) => {
      const { validateCpfPhonePlatform } = await import("@/lib/validate-cpf-phone-platform");
      const err = await validateCpfPhonePlatform(supabase, student);
      if (err) throw new Error(err);
      const { data: teacherId, error: teacherError } = await supabase.rpc("get_my_teacher_id");
      if (teacherError) throw teacherError;

      const { data, error } = await supabase
        .from("students")
        .insert({ ...student, teacher_id: teacherId as string | null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "by-teacher"] });
      toast.success("Aluno cadastrado com sucesso!");
    },
    onError: (error: unknown) => {
      const friendly = getDuplicateErrorMessage(error as { code?: string; message?: string });
      toast.error(friendly || "Não foi possível cadastrar o aluno. Por favor, tente novamente.");
    },
  });
}
