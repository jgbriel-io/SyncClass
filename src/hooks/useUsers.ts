import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseSignupClient } from "@/integrations/supabase/signup-client";
import { toast } from "sonner";

export interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profile: {
    id: string;
    user_id: string;
    full_name: string | null;
    email?: string | null;
    student_id: string | null;
    teacher_id?: string | null;
    role?: "admin" | "student" | "teacher" | null;
    active?: boolean | null;
    created_at: string | null;
    updated_at?: string | null;
  } | null;
  role: {
    id: string;
    user_id: string;
    role: "admin" | "student" | "teacher";
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
      return (profiles || []).map(profile => {
        const roleRow = (roles || []).find((r: any) => r.user_id === profile.user_id) as any | undefined;

        const emailFromProfile = (profile as any).email as string | null | undefined;
        const emailFromRole = roleRow?.email as string | null | undefined;

        return {
          id: profile.user_id,
          email: emailFromProfile || emailFromRole || "",
          created_at: profile.created_at || "",
          profile: {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name,
            email: emailFromProfile ?? emailFromRole ?? null,
            student_id: profile.student_id,
            teacher_id: (profile as any).teacher_id ?? null,
            active: (profile as any).active ?? true,
            role: (profile as any).role ?? null,
            created_at: profile.created_at,
            updated_at: (profile as any).updated_at ?? null,
          },
          role: (roleRow as any) || null,
        } as UserWithProfile;
      });
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
      role: "admin" | "student" | "teacher";
    }) => {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (profileCheckError) {
        console.error("Error checking email uniqueness (profiles):", profileCheckError);
        throw new Error("Erro ao validar email. Tente novamente.");
      }

      if (existingProfile) {
        throw new Error(
          "Já existe uma conta com esse email. Use a aba Usuários para vincular ou editar essa conta."
        );
      }

      // Generate password if not provided or too short
      let finalPassword = password;
      if (!finalPassword || finalPassword.length < 6) {
        const chars =
          "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        const length = 10;
        finalPassword = "";
        for (let i = 0; i < length; i++) {
          finalPassword += chars.charAt(
            Math.floor(Math.random() * chars.length)
          );
        }
      }

      // Create user via signUp (will trigger profile creation)
      const { data: authData, error: authError } = await supabaseSignupClient.auth.signUp({
        email: normalizedEmail,
        password: finalPassword,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Update profile name and link to domain entity (student/teacher) if needed
      const userId = authData.user.id;
      console.log("Created user with ID:", userId, "intended role:", role);

      // Wait a bit for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 800));

      // Ensure profile exists and update name/role copy
      if (fullName) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName, role, email: normalizedEmail })
          .eq("user_id", userId);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        } else {
          console.log("Profile updated successfully with role:", role);
        }
      }

      // Use UPSERT to update the role created by trigger
      // This will UPDATE if exists, INSERT if not
      console.log("Upserting user_roles with role:", role);
      const { data: upsertedRole, error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: role,
          full_name: fullName,
          email: normalizedEmail,
        })
        .select();

      if (roleError) {
        console.error("Error setting teacher role:", roleError);
        throw new Error("Erro ao definir permissões do usuário");
      }
      console.log("Role upserted successfully:", upsertedRole);

      // If role is student/teacher, create minimal domain record and link it
      let createdStudent: { id: string } | null = null;
      let createdTeacher: { id: string } | null = null;

      if (role === "student") {
        const { data: student, error: studentError } = await supabase
          .from("students")
          .insert({
            name: fullName || normalizedEmail,
            email: normalizedEmail,
          })
          .select("id")
          .single();

        if (studentError) {
          console.error("Error creating student for new user:", studentError);
        } else if (student?.id) {
          createdStudent = { id: student.id };
          const { error: linkError } = await supabase
            .from("profiles")
            .update({ student_id: student.id })
            .eq("user_id", userId);

          if (linkError) {
            console.error("Error linking profile to created student:", linkError);
          }
        }
      } else if (role === "teacher") {
        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .insert({
            name: fullName || normalizedEmail,
            email: normalizedEmail,
          })
          .select("id")
          .single();

        if (teacherError) {
          console.error("Error creating teacher for new user:", teacherError);
        } else if (teacher?.id) {
          createdTeacher = { id: teacher.id };
          const { error: linkError } = await supabase
            .from("profiles")
            .update({ teacher_id: teacher.id })
            .eq("user_id", userId);

          if (linkError) {
            console.error("Error linking profile to created teacher:", linkError);
          }
        }
      }

      return {
        user: authData.user,
        password: finalPassword,
        createdStudent,
        createdTeacher,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
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
      role: "admin" | "student" | "teacher";
    }) => {
      const { error } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: role,
        });

      if (error) throw error;

      // Get current profile to know email, name and links
      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("id, full_name, email, student_id, teacher_id, role")
        .eq("user_id", userId)
        .single();

      if (profileFetchError) {
        console.error("Error fetching profile for role update:", profileFetchError);
        throw profileFetchError;
      }

      const fullName = (profile.full_name as string | null) ?? "";
      const normalizedEmail = (profile.email as string | null | undefined)?.trim().toLowerCase();

      // Keep profile role copy in sync
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("user_id", userId);

      if (profileError) {
        console.error("Error updating profile role copy:", profileError);
      }

      // When switching to student/teacher, ensure there is a corresponding domain record linked
      if (role === "student") {
        if (!profile.student_id && normalizedEmail) {
          const { data: student, error: studentError } = await supabase
            .from("students")
            .insert({
              name: fullName || normalizedEmail,
              email: normalizedEmail,
            })
            .select("id")
            .single();

          if (studentError) {
            console.error("Error creating student when updating role:", studentError);
          } else if (student?.id) {
            const { error: linkError } = await supabase
              .from("profiles")
              .update({ student_id: student.id })
              .eq("user_id", userId);

            if (linkError) {
              console.error("Error linking profile to created student on role update:", linkError);
            }
          }
        }
      } else if (role === "teacher") {
        if (!profile.teacher_id && normalizedEmail) {
          const { data: teacher, error: teacherError } = await supabase
            .from("teachers")
            .insert({
              name: fullName || normalizedEmail,
              email: normalizedEmail,
            })
            .select("id")
            .single();

          if (teacherError) {
            console.error("Error creating teacher when updating role:", teacherError);
          } else if (teacher?.id) {
            const { error: linkError } = await supabase
              .from("profiles")
              .update({ teacher_id: teacher.id })
              .eq("user_id", userId);

            if (linkError) {
              console.error("Error linking profile to created teacher on role update:", linkError);
            }
          }
        }
      }
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
      // Soft delete: mark profile as inactive instead of removing records
      const { error } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário desativado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário. Tente novamente.");
    },
  });
}

// Hard delete user via Edge Function (admin-only)
export function useHardDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário excluído definitivamente.");
    },
    onError: (error: any) => {
      console.error("Error hard-deleting user:", error);
      toast.error(
        error?.message ||
          "Erro ao excluir definitivamente o usuário. Tente novamente."
      );
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
      const { error } = await supabase
        .from("profiles")
        .update({ teacher_id: teacherId })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
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

// Unlink user from teacher
export function useUnlinkUserFromTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ teacher_id: null })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Vínculo de professor removido com sucesso!");
    },
    onError: (error: any) => {
      console.error("Error unlinking user from teacher:", error);
      toast.error("Erro ao remover vínculo de professor. Tente novamente.");
    },
  });
}

// Create auth user and link to an existing student
export function useCreateAuthUserForStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      email,
      fullName,
    }: {
      studentId: string;
      email: string;
      fullName: string;
    }) => {
      // Simple random password generator (8-10 chars)
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      const length = 10;
      let password = "";
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { data: authData, error: authError } = await supabaseSignupClient.auth.signUp({
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

      const userId = authData.user.id;

      // Link profile to existing student and update name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, student_id: studentId, role: "student", email })
        .eq("user_id", userId);

      if (profileError) {
        console.error("Error linking profile to student:", profileError);
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: "student" as any,
          full_name: fullName,
          email,
        });

      if (roleError) {
        console.error("Error setting student role:", roleError);
      }

      return { user: authData.user, password };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (error: any) => {
      console.error("Error creating auth user for student:", error);
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("already")) {
        toast.error(
          "Já existe uma conta com esse email. Use a aba Usuários para vincular esse aluno à conta existente."
        );
      } else {
        toast.error(
          error.message || "Erro ao criar conta de acesso para o aluno."
        );
      }
    },
  });
}

// Create auth user and link to an existing teacher
export function useCreateAuthUserForTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teacherId,
      email,
      fullName,
    }: {
      teacherId: string;
      email: string;
      fullName: string;
    }) => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      const length = 10;
      let password = "";
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { data: authData, error: authError } = await supabaseSignupClient.auth.signUp({
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

      const userId = authData.user.id;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, teacher_id: teacherId, role: "teacher", email })
        .eq("user_id", userId);

      if (profileError) {
        console.error("Error linking profile to teacher:", profileError);
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: "teacher" as any,
          full_name: fullName,
          email,
        });

      if (roleError) {
        console.error("Error setting teacher role:", roleError);
      }

      return { user: authData.user, password };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (error: any) => {
      console.error("Error creating auth user for teacher:", error);
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("already")) {
        toast.error(
          "Já existe uma conta com esse email. Use a aba Usuários para vincular esse professor à conta existente."
        );
      } else {
        toast.error(
          error.message || "Erro ao criar conta de acesso para o professor."
        );
      }
    },
  });
}
