import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Student = Tables<"students">;
export type StudentInsert = TablesInsert<"students">;
export type StudentUpdate = TablesUpdate<"students">;

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data as Student[];
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      const { data, error } = await supabase
        .from("students")
        .insert(student)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Aluno cadastrado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating student:", error);
      const err = error as any;
      const message: string = err?.message || "";

      if (err?.code === "23505") {
        if (message.includes("students_unique_email")) {
          toast.error("Já existe um aluno cadastrado com este email.");
          return;
        }
        if (message.includes("students_unique_cpf")) {
          toast.error("Já existe um aluno cadastrado com este CPF.");
          return;
        }
        if (message.includes("students_unique_phone")) {
          toast.error("Já existe um aluno cadastrado com este telefone.");
          return;
        }
      }

      toast.error("Erro ao cadastrar aluno. Tente novamente.");
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: StudentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("students")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Synchronize profiles, user_roles and active flag for linked users
      try {
        const updatedStudent = data as Student;
        const fullName = (updatedStudent as any).name as string | null | undefined;
        const rawEmail = (updatedStudent as any).email as string | null | undefined;
        const normalizedEmail = rawEmail
          ? rawEmail.trim().toLowerCase()
          : null;
        const status = (updatedStudent as any).status as string | null | undefined;
        const isActive = status === "ativo";

        const { data: linkedProfiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, user_id")
          .eq("student_id", updatedStudent.id);

        if (profileError) {
          throw profileError;
        }

        if (linkedProfiles && linkedProfiles.length > 0) {
          for (const profile of linkedProfiles as { id: string; user_id: string | null }[]) {
            const profileUpdate: Record<string, any> = {
              role: "student",
              active: isActive,
            };
            if (typeof fullName === "string" && fullName.length > 0) {
              profileUpdate.full_name = fullName;
            }
            if (typeof normalizedEmail === "string" && normalizedEmail.length > 0) {
              profileUpdate.email = normalizedEmail;
            }

            const { error: profileUpdateError } = await supabase
              .from("profiles")
              .update(profileUpdate)
              .eq("id", profile.id);

            if (profileUpdateError) {
              throw profileUpdateError;
            }

            if (profile.user_id) {
              const userRolePayload: Record<string, any> = {
                user_id: profile.user_id,
                role: "student",
              };
              if (typeof fullName === "string" && fullName.length > 0) {
                userRolePayload.full_name = fullName;
              }
              if (typeof normalizedEmail === "string" && normalizedEmail.length > 0) {
                userRolePayload.email = normalizedEmail;
              }

              const { error: roleError } = await supabase
                .from("user_roles")
                .upsert(userRolePayload, { onConflict: "user_id" });

              if (roleError) {
                throw roleError;
              }
            }
          }
        }
      } catch (syncError) {
        console.error("Error syncing student updates to profiles/user_roles:", syncError);
        throw syncError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Aluno atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating student:", error);
      const err = error as any;
      const message: string = err?.message || "";

      if (err?.code === "23505") {
        if (message.includes("students_unique_email")) {
          toast.error("Já existe um aluno cadastrado com este email.");
          return;
        }
        if (message.includes("students_unique_cpf")) {
          toast.error("Já existe um aluno cadastrado com este CPF.");
          return;
        }
        if (message.includes("students_unique_phone")) {
          toast.error("Já existe um aluno cadastrado com este telefone.");
          return;
        }
      }

      toast.error("Erro ao atualizar aluno. Tente novamente.");
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("students")
        .update({ status: "inativo" })
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Also mark linked profiles as inactive
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("student_id", id);

      if (profilesError) {
        throw profilesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Aluno desativado com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting student:", error);
      toast.error("Erro ao desativar aluno. Tente novamente.");
    },
  });
}
