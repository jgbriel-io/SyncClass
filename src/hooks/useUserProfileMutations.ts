import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import {
  validateAndResizeAvatar,
  type AvatarValidationError,
} from "@/lib/utils/avatarUpload";
import { sanitizeErrorMessage } from "@/lib/security/errorHandler";
import { pickAnonSegment } from "@/lib/utils/anonymize";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { layout, users as usersContent } from "@/content";

type AppRole = Enums<"app_role">;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function getExtensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpeg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpeg";
}

function getContentTypeForUpload(file: File, blob: Blob): string {
  const t = blob.type || file.type;
  if (ALLOWED_AVATAR_TYPES.includes(t as (typeof ALLOWED_AVATAR_TYPES)[number]))
    return t;
  return "image/jpeg";
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("id, full_name, email, student_id, teacher_id, role")
        .eq("user_id", userId)
        .single();
      if (profileFetchError) throw profileFetchError;
      const fullName = profile.full_name ?? "";
      const normalizedEmail = profile.email?.trim().toLowerCase() ?? null;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("user_id", userId);
      if (profileError) throw new Error("Erro ao atualizar role do perfil");
      if (role === "student" && !profile.student_id && normalizedEmail) {
        const { data: student, error: studentError } = await supabase
          .from("students")
          .insert({ name: fullName || normalizedEmail, email: normalizedEmail })
          .select("id")
          .single();
        if (studentError)
          throw new Error(
            getDuplicateErrorMessage(studentError) || studentError.message
          );
        if (student?.id)
          await supabase
            .from("profiles")
            .update({ student_id: student.id })
            .eq("user_id", userId);
      } else if (role === "teacher" && !profile.teacher_id && normalizedEmail) {
        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .insert({ name: fullName || normalizedEmail, email: normalizedEmail })
          .select("id")
          .single();
        if (teacherError)
          throw new Error(
            getDuplicateErrorMessage(teacherError) || teacherError.message
          );
        if (teacher?.id)
          await supabase
            .from("profiles")
            .update({ teacher_id: teacher.id })
            .eq("user_id", userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      toast.success(usersContent.form.toasts.successEdit);
    },
    onError: (error: Error) => toast.error(sanitizeErrorMessage(error)),
  });
}

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

      // Best-effort: sync display name in auth.users metadata (cosmetic, dashboard only)
      await supabase.rpc("admin_update_auth_display_name", {
        p_user_id: userId,
        p_full_name: fullName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
    },
    onError: () =>
      toast.error(
        "Não foi possível atualizar o perfil. Por favor, tente novamente."
      ),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      avatar_url,
    }: {
      userId: string;
      avatar_url?: string | null;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatar_url ?? null })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QK.CURRENT_USER_PROFILE, userId],
      });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      toast.success(layout.settings.profile.avatarSuccess);
    },
    onError: (err: Error) =>
      toast.error(
        err?.message?.trim()
          ? String(err.message)
          : "Não foi possível atualizar a foto. Por favor, tente novamente."
      ),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      file,
    }: {
      userId: string;
      file: File;
    }): Promise<void> => {
      const rateLimitResult = checkRateLimit(
        "uploadAvatar",
        RATE_LIMIT_CONFIGS.UPLOAD
      );
      if (!rateLimitResult.allowed)
        throw new Error(
          `Muitos uploads. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
        );
      const blob = await validateAndResizeAvatar(file).catch(
        (err: AvatarValidationError) => {
          toast.error(err.message);
          throw err;
        }
      );
      const contentType = getContentTypeForUpload(file, blob);
      const ext = getExtensionFromMime(contentType);
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(
          path,
          new File([blob], `avatar.${ext}`, { type: contentType }),
          { upsert: true, contentType }
        );
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", userId);
      if (updateError) throw updateError;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QK.CURRENT_USER_PROFILE, userId],
      });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      toast.success(layout.settings.profile.avatarSuccess);
    },
    onError: (err: Error) => {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as AvatarValidationError).code
      )
        return;
      toast.error(
        err?.message?.trim()
          ? String(err.message)
          : "Não foi possível enviar a foto. Por favor, tente novamente."
      );
    },
  });
}

/**
 * Atualiza nome do perfil (auth.user_metadata.full_name + profiles.full_name)
 */
export function useUpdateProfileName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      fullName,
    }: {
      userId: string;
      fullName: string;
    }) => {
      const trimmed = fullName.trim();
      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: trimmed })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QK.CURRENT_USER_PROFILE, userId],
      });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      toast.success(layout.settings.profile.toasts.nameSuccess);
    },
    onError: (err: Error) => {
      toast.error(
        err?.message?.trim() ? String(err.message) : "Erro ao atualizar nome."
      );
    },
  });
}

/**
 * Atualiza email do usuário (auth.updateUser)
 */
export function useUpdateProfileEmail() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const normalized = email.trim().toLowerCase();
      const { error } = await supabase.rpc("user_update_own_email", {
        p_email: normalized,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(layout.settings.profile.toasts.emailSuccess);
    },
    onError: (err: Error) => {
      toast.error(
        err?.message?.trim() ? String(err.message) : "Erro ao atualizar email."
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: currentProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("student_id, teacher_id")
        .eq("user_id", userId)
        .single();
      if (fetchError) throw fetchError;
      const { error } = await supabase
        .from("profiles")
        .update({
          active: false,
          student_id: currentProfile.student_id,
          teacher_id: currentProfile.teacher_id,
        })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES, "all"] });
    },
    onError: () =>
      toast.error(
        "Não foi possível excluir o usuário. Por favor, tente novamente."
      ),
  });
}

export function useHardDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      // Anonymize profile PII before deleting auth account (LGPD)
      const { error: anonError } = await supabase
        .from("profiles")
        .update({
          deleted_at: new Date().toISOString(),
          active: false,
          full_name: `Usuário ${pickAnonSegment(userId)}`,
          email: null,
          avatar_url: null,
        })
        .eq("user_id", userId);

      if (anonError) throw anonError;

      const { data, error } = await supabase.functions.invoke(
        "admin-delete-user",
        { body: { userId } }
      );
      if (error) throw error;
      const msg = (data as { error?: string } | null)?.error;
      if (msg) throw new Error(msg);
    },
    onSuccess: () => {
      [
        QK.USERS,
        QK.PROFILES,
        [QK.PROFILES, "all"],
        QK.STUDENTS,
        QK.STUDENTS_PAGINATED,
        QK.TEACHERS,
        QK.TEACHERS_PAGINATED,
      ].forEach((key) =>
        queryClient.invalidateQueries({
          queryKey: Array.isArray(key) ? key : [key],
        })
      );
    },
    onError: (error: unknown) => toast.error(sanitizeErrorMessage(error)),
  });
}
