import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/integrations/supabase/env";
import { sanitizeErrorMessage } from "@/lib/security/errorHandler";
import { toast } from "sonner";
import type { Enums, TablesInsert } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { users as usersContent } from "@/content";
import {
  generateRandomPassword,
  invokeInviteUser,
  isEdgeFunctionNetworkError,
  type InviteUserBody,
  type InviteUserResult,
} from "./inviteUserService";

export type { InviteUserBody, InviteUserResult };

type AppRole = Enums<"app_role">;
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
      const rateLimitResult = checkRateLimit(
        "createUser",
        RATE_LIMIT_CONFIGS.AUTH
      );
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Muitas tentativas de criação de usuário. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
        );
      }
      const normalizedEmail = email.trim().toLowerCase();
      const finalPassword =
        !password || password.length < 6 ? generateRandomPassword() : password;
      const body: InviteUserBody = {
        email: normalizedEmail,
        password: finalPassword,
        full_name: fullName || normalizedEmail,
        role,
      };
      if (role === "student" && studentData)
        body.studentData = {
          ...studentData,
          name: studentData.name || fullName,
          email: normalizedEmail,
        };
      if (role === "teacher" && teacherData)
        body.teacherData = {
          ...teacherData,
          name: teacherData.name || fullName,
          email: normalizedEmail,
        };
      const result = await invokeInviteUser(body);
      return {
        user: { id: result.userId } as { id: string },
        password: result.password,
        createdStudent: result.createdStudent,
        createdTeacher: result.createdTeacher,
        permissionsWarning: result.permissionsWarning,
      };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
      if (variables.role === "student" || result?.createdStudent)
        queryClient.invalidateQueries({ queryKey: [QK.STUDENTS] });
      if (variables.role === "teacher" || result?.createdTeacher)
        queryClient.invalidateQueries({ queryKey: [QK.TEACHERS] });
      if (!result?.password) toast.success(usersContent.form.toasts.success);
    },
    onError: (error: Error, variables) => {
      logger.error(error, {
        context: "useCreateUser",
        email: variables.email,
        role: variables.role,
      });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (params: {
      userId?: string;
      studentId?: string;
      teacherId?: string;
      password: string;
    }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token)
        throw new Error("Sessão expirada. Faça login novamente.");
      const functionsBase =
        import.meta.env.DEV && typeof window !== "undefined"
          ? `${window.location.origin}/supabase-functions`
          : `${SUPABASE_URL}/functions/v1`;
      try {
        const res = await fetch(`${functionsBase}/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            ...params,
            accessToken: session.access_token,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok)
          throw new Error(
            data?.error ?? (res.statusText || "Erro ao redefinir senha.")
          );
        if (data?.error) throw new Error(data.error);
      } catch (err) {
        if (isEdgeFunctionNetworkError(err))
          throw new Error(
            "Não foi possível contactar o servidor. Verifique sua conexão e se a Edge Function 'reset-password' está publicada no projeto Supabase."
          );
        throw err;
      }
    },
    onSuccess: () =>
      toast.success(usersContent.resetPasswordDialog.toasts.successForUser),
    onError: (error: Error) => toast.error(sanitizeErrorMessage(error)),
  });
}

export function useResetOwnPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token)
        throw new Error("Sessão expirada. Faça login novamente.");
      const functionsBase =
        import.meta.env.DEV && typeof window !== "undefined"
          ? `${window.location.origin}/supabase-functions`
          : `${SUPABASE_URL}/functions/v1`;
      try {
        const res = await fetch(`${functionsBase}/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            accessToken: session.access_token,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok)
          throw new Error(
            data?.error ?? (res.statusText || "Erro ao redefinir senha.")
          );
        if (data?.error) throw new Error(data.error);
      } catch (err) {
        if (isEdgeFunctionNetworkError(err))
          throw new Error(
            "Não foi possível contactar o servidor. Verifique sua conexão e se a Edge Function 'reset-password' está publicada no projeto Supabase."
          );
        throw err;
      }
    },
    onSuccess: async () => {
      toast.success(
        "Senha alterada com sucesso! Você será redirecionado para o login."
      );
      setTimeout(async () => {
        try {
          await supabase.auth.signOut({ scope: "global" });
        } catch {
          /* ignorar */
        }
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-"))
          .forEach((k) => localStorage.removeItem(k));
        Object.keys(sessionStorage)
          .filter((k) => k.startsWith("sb-"))
          .forEach((k) => sessionStorage.removeItem(k));
        navigate("/login", { replace: true });
      }, 1500);
    },
    onError: (error: Error) => toast.error(sanitizeErrorMessage(error)),
  });
}
