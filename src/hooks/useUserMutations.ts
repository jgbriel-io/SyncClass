import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseSignupClient } from "@/integrations/supabase/signup-client";
import { toast } from "sonner";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

// Types for mutations
type AppRole = Enums<"app_role">;
type ProfileRow = Tables<"profiles">;
type UserRoleRow = Tables<"user_roles">;
type StudentInsert = TablesInsert<"students">;
type TeacherInsert = TablesInsert<"teachers">;

interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  studentData?: Partial<StudentInsert>;
  teacherData?: Partial<TeacherInsert>;
}

interface UpdateUserRoleParams {
  userId: string;
  role: AppRole;
}

interface UpdateUserProfileParams {
  userId: string;
  fullName: string;
}

interface LinkUserParams {
  userId: string;
  studentId?: string;
  teacherId?: string;
}

interface CreateAuthUserParams {
  studentId?: string;
  teacherId?: string;
  email: string;
  fullName: string;
}

// Helper function to generate random password
function generateRandomPassword(length: number = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper function to wait for trigger completion
function waitForTrigger(ms: number = 800): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Create a new user
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
      role,
      studentData,
      teacherData,
    }: CreateUserParams) => {
      const normalizedEmail = email.trim().toLowerCase();

      // Check if profile already exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (profileCheckError) {
        throw new Error("Erro ao validar email. Tente novamente.");
      }

      if (existingProfile) {
        throw new Error(
          "Já existe uma conta com esse email. Use a aba Usuários para vincular ou editar essa conta."
        );
      }

      // Generate password if not provided or too short
      const finalPassword = (!password || password.length < 6) 
        ? generateRandomPassword() 
        : password;

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

      const userId = authData.user.id;

      // Wait for trigger to complete
      await waitForTrigger();

      // Update profile with name, role and email
      if (fullName) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: fullName, role, email: normalizedEmail })
          .eq("user_id", userId);

        if (profileError) {
          throw new Error("Erro ao atualizar perfil");
        }
      }

      // Upsert role (will update if exists, insert if not)
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: role,
            full_name: fullName,
            email: normalizedEmail,
          },
          { onConflict: "user_id" }
        )
        .select();

      if (roleError) {
        throw new Error("Erro ao definir permissões do usuário");
      }

      // Create and link domain records for student/teacher
      let createdStudent: { id: string } | null = null;
      let createdTeacher: { id: string } | null = null;

      if (role === "student") {
        const studentInsertData: StudentInsert = studentData 
          ? { ...studentData, name: studentData.name || fullName, email: normalizedEmail }
          : { name: fullName || normalizedEmail, email: normalizedEmail };

        const { data: student, error: studentError } = await supabase
          .from("students")
          .insert(studentInsertData)
          .select("id")
          .single();

        if (studentError) {
          throw new Error("Erro ao criar registro de aluno");
        }
        
        if (student?.id) {
          createdStudent = { id: student.id };
          const { error: linkError } = await supabase
            .from("profiles")
            .update({ student_id: student.id })
            .eq("user_id", userId);

          if (linkError) {
            throw new Error("Erro ao vincular perfil ao aluno");
          }
        }
      } else if (role === "teacher") {
        const teacherInsertData: TeacherInsert = teacherData
          ? { ...teacherData, name: teacherData.name || fullName, email: normalizedEmail }
          : { name: fullName || normalizedEmail, email: normalizedEmail };

        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .insert(teacherInsertData)
          .select("id")
          .single();

        if (teacherError) {
          throw new Error("Erro ao criar registro de professor");
        }
        
        if (teacher?.id) {
          createdTeacher = { id: teacher.id };
          const { error: linkError } = await supabase
            .from("profiles")
            .update({ teacher_id: teacher.id })
            .eq("user_id", userId);

          if (linkError) {
            throw new Error("Erro ao vincular perfil ao professor");
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
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar usuário. Tente novamente.");
    },
  });
}

// Update user role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: UpdateUserRoleParams) => {
      // Get current profile to know email, name and links
      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("id, full_name, email, student_id, teacher_id, role")
        .eq("user_id", userId)
        .single();

      if (profileFetchError) {
        throw profileFetchError;
      }

      const fullName = profile.full_name ?? "";
      const normalizedEmail = profile.email?.trim().toLowerCase() ?? null;

      // Keep user_roles in sync
      const { error } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: role,
            full_name: fullName || null,
            email: normalizedEmail,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      // Keep profile role copy in sync
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("user_id", userId);

      if (profileError) {
        throw new Error("Erro ao atualizar role do perfil");
      }

      // When switching to student/teacher, ensure there is a corresponding domain record linked
      if (role === "student" && !profile.student_id && normalizedEmail) {
        const { data: student, error: studentError } = await supabase
          .from("students")
          .insert({
            name: fullName || normalizedEmail,
            email: normalizedEmail,
          })
          .select("id")
          .single();

        if (!studentError && student?.id) {
          await supabase
            .from("profiles")
            .update({ student_id: student.id })
            .eq("user_id", userId);
        }
      } else if (role === "teacher" && !profile.teacher_id && normalizedEmail) {
        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .insert({
            name: fullName || normalizedEmail,
            email: normalizedEmail,
          })
          .select("id")
          .single();

        if (!teacherError && teacher?.id) {
          await supabase
            .from("profiles")
            .update({ teacher_id: teacher.id })
            .eq("user_id", userId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Privilégio atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar privilégio. Tente novamente.");
    },
  });
}

// Update user profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, fullName }: UpdateUserProfileParams) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    },
  });
}

// Delete user (soft delete)
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ active: false })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      toast.success("Usuário desativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir usuário. Tente novamente.");
    },
  });
}

// Hard delete user via Edge Function
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
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      toast.success("Usuário excluído definitivamente.");
    },
    onError: (error: Error) => {
      toast.error(
        error?.message || "Erro ao excluir definitivamente o usuário. Tente novamente."
      );
    },
  });
}

// Link user to student
export function useLinkUserToStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, studentId }: LinkUserParams & { studentId: string }) => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ student_id: studentId, role: "student" })
        .eq("user_id", userId);

      if (profileUpdateError) throw profileUpdateError;

      const fullName = profile?.full_name ?? null;
      const email = profile?.email ?? null;

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: "student",
            full_name: fullName,
            email,
          },
          { onConflict: "user_id" }
        );

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      toast.success("Usuário vinculado ao aluno com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao vincular usuário ao aluno. Tente novamente.");
    },
  });
}

// Link user to teacher
export function useLinkUserToTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, teacherId }: LinkUserParams & { teacherId: string }) => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ teacher_id: teacherId, role: "teacher" })
        .eq("user_id", userId);

      if (profileUpdateError) throw profileUpdateError;

      const fullName = profile?.full_name ?? null;
      const email = profile?.email ?? null;

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: "teacher",
            full_name: fullName,
            email,
          },
          { onConflict: "user_id" }
        );

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      toast.success("Usuário vinculado ao professor com sucesso!");
    },
    onError: (error: Error) => {
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
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      toast.success("Vínculo removido com sucesso!");
    },
    onError: (error: Error) => {
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
    onError: (error: Error) => {
      toast.error("Erro ao remover vínculo de professor. Tente novamente.");
    },
  });
}

// Create auth user and link to an existing student
export function useCreateAuthUserForStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, email, fullName }: CreateAuthUserParams & { studentId: string }) => {
      const password = generateRandomPassword();

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
        throw new Error("Erro ao vincular perfil ao aluno");
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: "student",
            full_name: fullName,
            email,
          },
          { onConflict: "user_id" }
        );

      if (roleError) {
        throw new Error("Erro ao definir role de aluno");
      }

      return { user: authData.user, password };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: async (error: Error, variables: CreateAuthUserParams) => {
      const emailVar = variables.email?.trim().toLowerCase();

      if (emailVar) {
        try {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("user_id, student_id")
            .ilike("email", emailVar)
            .maybeSingle();

          if (existingProfile) {
            // Profile already exists, suppress duplicate toast
            return;
          }
        } catch {
          // Ignore and fall back to default message
        }
      }

      const message = error?.message?.toLowerCase() || "";
      if (message.includes("already")) {
        toast.error(
          "Já existe uma conta com esse email. Use a aba Usuários para vincular esse aluno à conta existente."
        );
      } else {
        toast.error(error.message || "Erro ao criar conta de acesso para o aluno.");
      }
    },
  });
}

// Create auth user and link to an existing teacher
export function useCreateAuthUserForTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teacherId, email, fullName }: CreateAuthUserParams & { teacherId: string }) => {
      const password = generateRandomPassword();

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
        throw new Error("Erro ao vincular perfil ao professor");
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: "teacher",
            full_name: fullName,
            email,
          },
          { onConflict: "user_id" }
        );

      if (roleError) {
        throw new Error("Erro ao definir role de professor");
      }

      return { user: authData.user, password };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: async (error: Error, variables: CreateAuthUserParams) => {
      const emailVar = variables.email?.trim().toLowerCase();

      if (emailVar) {
        try {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("user_id, teacher_id")
            .ilike("email", emailVar)
            .maybeSingle();

          if (existingProfile) {
            // Profile already exists, suppress duplicate toast
            return;
          }
        } catch {
          // Ignore and fall back to default
        }
      }

      const message = error?.message?.toLowerCase() || "";
      if (message.includes("already")) {
        toast.error(
          "Já existe uma conta com esse email. Use a aba Usuários para vincular esse professor à conta existente."
        );
      } else {
        toast.error(error.message || "Erro ao criar conta de acesso para o professor.");
      }
    },
  });
}
