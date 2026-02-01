import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Student = Tables<"students">;
export type StudentInsert = TablesInsert<"students">;
export type StudentUpdate = TablesUpdate<"students">;
type ProfileUpdate = TablesUpdate<"profiles">;

interface PostgresError {
  code?: string;
  message?: string;
}

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      // Use students_active_masked view para:
      // 1. Mascarar CPF e telefone conforme LGPD
      // 2. Excluir alunos deletados (soft delete)
      // Admin vê dados completos, outros usuários veem dados mascarados
      const { data, error } = await supabase
        .from("students_active_masked")
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
      const { validateCpfPhonePlatform } = await import("@/lib/validate-cpf-phone-platform");
      const err = await validateCpfPhonePlatform(supabase, student);
      if (err) throw new Error(err);
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
    onError: (error: unknown) => {
      const friendly = getDuplicateErrorMessage(error as PostgresError);
      toast.error(friendly || "Erro ao cadastrar aluno. Tente novamente.");
    },
  });
}

/** Remove cpf/phone do update se parecerem mascarados (evita sobrescrever dados reais com ***) */
function sanitizeStudentUpdateForEdit(updates: Record<string, unknown>): Record<string, unknown> {
  const out = { ...updates };
  if (typeof out.cpf === "string" && out.cpf.includes("*")) {
    delete out.cpf;
  }
  if (typeof out.phone === "string" && out.phone.includes("*")) {
    delete out.phone;
  }
  return out;
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: StudentUpdate & { id: string }) => {
      const safeUpdates = sanitizeStudentUpdateForEdit(updates as Record<string, unknown>) as StudentUpdate;
      const { data, error } = await supabase
        .from("students")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Synchronize profiles, user_roles and active flag for linked users
      const updatedStudent = data as Student;
      const fullName = updatedStudent.name;
      const rawEmail = updatedStudent.email;
      const normalizedEmail = rawEmail ? rawEmail.trim().toLowerCase() : null;
      const isActive = updatedStudent.status === "ativo";

      const { data: linkedProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("student_id", updatedStudent.id);

      if (profileError) {
        throw profileError;
      }

      if (linkedProfiles && linkedProfiles.length > 0) {
        for (const profile of linkedProfiles) {
          const profileUpdate: ProfileUpdate = {
            role: "student",
            active: isActive,
          };
          if (fullName) {
            profileUpdate.full_name = fullName;
          }
          if (normalizedEmail) {
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
            const { error: roleError } = await supabase.rpc("upsert_user_role_safe", {
              p_user_id: profile.user_id,
              p_role: "student",
              p_full_name: fullName ?? null,
              p_email: normalizedEmail,
            });
            if (roleError) throw roleError;
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Aluno atualizado com sucesso!");
    },
    onError: (error: unknown) => {
      const pgErr = error as PostgresError;
      const friendly = getDuplicateErrorMessage(pgErr);
      const msg = pgErr?.message || (error as Error)?.message;
      toast.error(friendly || msg || "Erro ao atualizar aluno. Tente novamente.");
    },
  });
}

/**
 * @deprecated Use useSoftDeleteStudent() instead to preserve data history
 */
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
      toast.success("Aluno arquivado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao arquivar aluno. Tente novamente.");
    },
  });
}

/**
 * Soft delete student - preserves class_logs and financial_records
 * Sets deleted_at timestamp and status to 'inativo'
 */
export function useSoftDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Call Supabase function for soft delete
      const { error } = await supabase.rpc("soft_delete_student", {
        p_student_id: id,
      });

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
      toast.success("Aluno arquivado com sucesso!");
    },
    onError: (error: unknown) => {
      const err = error as PostgresError;
      console.error("Erro ao arquivar aluno:", err);
      toast.error("Erro ao arquivar aluno. Tente novamente.");
    },
  });
}

/**
 * Restore soft-deleted student
 * Removes deleted_at timestamp and reactivates student
 */
export function useRestoreStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Call Supabase function for restore
      const { error } = await supabase.rpc("restore_student", {
        p_student_id: id,
      });

      if (error) {
        throw error;
      }

      // Also mark linked profiles as active
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: true })
        .eq("student_id", id);

      if (profilesError) {
        throw profilesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Aluno restaurado com sucesso!");
    },
    onError: (error: unknown) => {
      const err = error as PostgresError;
      console.error("Erro ao restaurar aluno:", err);
      toast.error("Erro ao restaurar aluno. Tente novamente.");
    },
  });
}
