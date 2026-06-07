import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import { sanitizeErrorMessage } from "@/lib/security/errorHandler";
import { toast } from "sonner";
import { common } from "@/content";
import { invokeInviteUser } from "./inviteUserService";

function sendWelcomeEmail(email: string) {
  supabase.auth
    .resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    .catch(() => {
      /* fire-and-forget */
    });
}

interface CreateAuthUserParams {
  studentId?: string;
  teacherId?: string;
  email: string;
  fullName: string;
}

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
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ student_id: studentId, role: "student" })
        .eq("user_id", userId);
      if (profileUpdateError) throw profileUpdateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
    },
    onError: () =>
      toast.error(
        "Não foi possível vincular o usuário ao aluno. Por favor, tente novamente."
      ),
  });
}

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
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ teacher_id: teacherId, role: "teacher" })
        .eq("user_id", userId);
      if (profileUpdateError) throw profileUpdateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
    },
    onError: (error: Error) => toast.error(sanitizeErrorMessage(error)),
  });
}

export function useCreateAuthUserForStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      email,
      fullName,
    }: CreateAuthUserParams & { studentId: string }) => {
      const result = await invokeInviteUser({
        email: email.trim().toLowerCase(),
        full_name: fullName || email,
        role: "student",
        studentId,
      });
      sendWelcomeEmail(email.trim().toLowerCase());
      return {
        user: { id: result.userId } as { id: string },
        password: result.password,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
    },
    onError: (error: Error) => {
      const msg = error?.message?.toLowerCase() || "";
      toast.error(
        msg.includes("already") || msg.includes("cadastrado")
          ? common.errors.duplicateEmail
          : error.message
      );
    },
  });
}

export function useCreateAuthUserForTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teacherId,
      email,
      fullName,
    }: CreateAuthUserParams & { teacherId: string }) => {
      const result = await invokeInviteUser({
        email: email.trim().toLowerCase(),
        full_name: fullName || email,
        role: "teacher",
        teacherId,
      });
      sendWelcomeEmail(email.trim().toLowerCase());
      return {
        user: { id: result.userId } as { id: string },
        password: result.password,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
    },
    onError: (error: Error) => {
      const msg = error?.message?.toLowerCase() || "";
      toast.error(
        msg.includes("already") || msg.includes("cadastrado")
          ? common.errors.duplicateEmail
          : error.message
      );
    },
  });
}
