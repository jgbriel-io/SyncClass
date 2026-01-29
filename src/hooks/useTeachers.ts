import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseSignupClient } from "@/integrations/supabase/signup-client";
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
      // 1. Criar o registro do professor
      const { data, error } = await supabase
        .from("teachers")
        .insert(teacher)
        .select()
        .single();
      if (error) throw error;

      const createdTeacher = data as Teacher;

      // 2. Criar conta de acesso (auth.user) se tiver email
      if (createdTeacher.email) {
        try {
          const normalizedEmail = createdTeacher.email.trim().toLowerCase();
          
          // Gerar senha aleatória
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
          let password = "";
          for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          // Criar auth.user (trigger criará profiles + user_roles automaticamente)
          const { data: authData, error: authError } = await supabaseSignupClient.auth.signUp({
            email: normalizedEmail,
            password: password,
            options: {
              data: {
                full_name: createdTeacher.name,
              },
              emailRedirectTo: `${window.location.origin}/login`,
            },
          });

          if (authError) {
            console.error("Erro ao criar conta de acesso:", authError);
            toast.warning("Professor cadastrado, mas não foi possível criar a conta de acesso.");
          } else if (authData.user) {
            const userId = authData.user.id;
            console.log("✅ Auth user criado:", userId);

            // Aguardar trigger completar
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verificar se profile já existe (criado pelo trigger)
            const { data: existingProfile, error: checkError } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", userId)
              .maybeSingle();

            console.log("🔍 Profile existente?", existingProfile);

            if (checkError) {
              console.error("❌ Erro ao verificar profile:", checkError);
            }

            // UPSERT profile (cria se não existir, atualiza se existir)
            const profilePayload = {
              user_id: userId,
              teacher_id: createdTeacher.id,
              role: "teacher",
              full_name: createdTeacher.name,
              email: normalizedEmail,
              active: true
            };

            console.log("📝 Tentando UPSERT profile:", profilePayload);

            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .upsert(profilePayload, { 
                onConflict: "user_id",
                ignoreDuplicates: false 
              })
              .select()
              .single();

            if (profileError) {
              console.error("❌ ERRO ao criar profile:", {
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint,
                code: profileError.code
              });
              toast.error(`Erro ao criar profile: ${profileError.message}`);
            } else {
              console.log("✅ Profile criado/atualizado:", profileData);
            }

            // UPSERT user_roles para garantir role de teacher
            const { data: roleData, error: roleError } = await supabase
              .from("user_roles")
              .upsert({
                user_id: userId,
                role: "teacher",
                full_name: createdTeacher.name,
                email: normalizedEmail,
              }, { onConflict: "user_id" })
              .select()
              .single();

            if (roleError) {
              console.error("❌ ERRO ao criar user_role:", roleError);
            } else {
              console.log("✅ User_role criado/atualizado:", roleData);
            }

            // Forçar atualização das queries
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
          }
        } catch (authError) {
          console.error("❌ Erro ao criar conta de acesso:", authError);
          toast.error(`Erro: ${authError}`);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Professor e conta de acesso cadastrados com sucesso!");
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

      // Synchronize profiles, user_roles and active flag for linked users
      try {
        const updatedTeacher = data as Teacher;
        const fullName = (updatedTeacher as any).name as string | null | undefined;
        const rawEmail = (updatedTeacher as any).email as string | null | undefined;
        const normalizedEmail = rawEmail
          ? rawEmail.trim().toLowerCase()
          : null;
        const status = (updatedTeacher as any).status as string | null | undefined;
        const isActive = status === "ativo";

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

      // Also mark linked profiles as inactive
      const { error: profilesError } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("teacher_id", id);

      if (profilesError) {
        throw profilesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Professor desativado com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting teacher:", error);
      toast.error("Erro ao excluir professor. Tente novamente.");
    },
  });
}
