import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Teacher = Tables<"teachers">;
export type TeacherInsert = TablesInsert<"teachers">;
export type TeacherUpdate = TablesUpdate<"teachers">;

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Teacher[];
    },
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teacher: TeacherInsert) => {
      const { data, error } = await supabase
        .from("teachers")
        .insert(teacher)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Professor cadastrado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating teacher:", error);
      toast.error("Erro ao cadastrar professor. Tente novamente.");
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TeacherUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("teachers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Synchronize profiles and user_roles for linked users
      try {
        const updatedTeacher = data as Teacher;
        const fullName = (updatedTeacher as any).name as string | null | undefined;
        const rawEmail = (updatedTeacher as any).email as string | null | undefined;
        const normalizedEmail = rawEmail
          ? rawEmail.trim().toLowerCase()
          : null;

        const { data: linkedProfiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, user_id")
          .eq("teacher_id", updatedTeacher.id);

        if (profileError) {
          throw profileError;
        }

        if (linkedProfiles && linkedProfiles.length > 0) {
          for (const profile of linkedProfiles as { id: string; user_id: string | null }[]) {
            const profileUpdate: Record<string, any> = {
              role: "teacher",
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
                role: "teacher",
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
        console.error("Error syncing teacher updates to profiles/user_roles:", syncError);
        throw syncError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Professor atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating teacher:", error);
      toast.error("Erro ao atualizar professor. Tente novamente.");
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: mark teacher as inativo instead of removing row
      const { error } = await supabase
        .from("teachers")
        .update({ status: "inativo" as any })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Professor desativado com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting teacher:", error);
      toast.error("Erro ao excluir professor. Tente novamente.");
    },
  });
}
