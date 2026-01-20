import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profile: {
    id: string;
    user_id: string;
    full_name: string | null;
    student_id: string | null;
    created_at: string | null;
  } | null;
  role: {
    id: string;
    user_id: string;
    role: "admin" | "student";
  } | null;
}

// Fetch all users with their profiles and roles
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Buscar perfis
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combinar perfis e roles
      return (profiles || []).map(profile => ({
        id: profile.user_id,
        email: "", // Preencher se necessário
        created_at: profile.created_at || "",
        profile: {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          student_id: profile.student_id,
          created_at: profile.created_at,
        },
        role: roles?.find(r => r.user_id === profile.user_id) || null,
      }));
    },
  });
}

// Create a new user
// Note: Without Admin API, we use signUp which requires email confirmation
// For production, consider creating an Edge Function with Admin API
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
      role,
    }: {
      email: string;
      password: string;
      fullName: string;
      role: "admin" | "student";
    }) => {
      // Create user via signUp (will trigger profile creation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Update profile name if needed
      if (fullName) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName })
          .eq("user_id", authData.user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }

      // Update role (admin can do this via RLS policy)
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: authData.user.id,
          role: role,
        });

      if (roleError) {
        console.error("Error updating role:", roleError);
        // Don't throw - role might be set by trigger
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário criado com sucesso! O usuário precisará confirmar o email.");
    },
    onError: (error: any) => {
      console.error("Error creating user:", error);
      toast.error(error.message || "Erro ao criar usuário. Tente novamente.");
    },
  });
}

// Update user role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "student";
    }) => {
      const { error } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: role,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Privilégio atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error updating role:", error);
      toast.error("Erro ao atualizar privilégio. Tente novamente.");
    },
  });
}

// Update user profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      fullName,
    }: {
      userId: string;
      fullName: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    },
  });
}

// Delete user
// Note: Without Admin API, we can only delete the profile and role
// The auth user will remain but won't be accessible
// For full deletion, use an Edge Function with Admin API
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete role first
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (roleError) {
        console.error("Error deleting role:", roleError);
      }

      // Delete profile (this will cascade if configured)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (profileError) throw profileError;

      // Note: The auth user will still exist but won't be accessible
      // For production, create an Edge Function to fully delete the user
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário removido com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário. Tente novamente.");
    },
  });
}

// Link user to student
export function useLinkUserToStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      studentId,
    }: {
      userId: string;
      studentId: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ student_id: studentId })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário vinculado ao aluno com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error linking user to student:", error);
      toast.error("Erro ao vincular usuário ao aluno. Tente novamente.");
    },
  });
}

// Link user to teacher
export function useLinkUserToTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      teacherId,
    }: {
      userId: string;
      teacherId: string;
    }) => {
      // First, check if teachers table has user_id column
      // If not, we might need to add it via migration
      // For now, we'll update the teacher record with user_id if the column exists
      const { error } = await supabase
        .from("teachers")
        .update({ user_id: userId } as any)
        .eq("id", teacherId);

      if (error) {
        // If column doesn't exist, we'll need to handle it differently
        // For now, just log the error
        console.warn("Could not link user to teacher - user_id column may not exist:", error);
        throw new Error("A tabela teachers não possui coluna user_id. É necessário criar uma migração.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Usuário vinculado ao professor com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error linking user to teacher:", error);
      toast.error(error.message || "Erro ao vincular usuário ao professor. Tente novamente.");
    },
  });
}

// Unlink user from student
export function useUnlinkUserFromStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ student_id: null })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Vínculo removido com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error unlinking user from student:", error);
      toast.error("Erro ao remover vínculo. Tente novamente.");
    },
  });
}
