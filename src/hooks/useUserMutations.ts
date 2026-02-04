import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/integrations/supabase/env";
import { supabaseSignupClient } from "@/integrations/supabase/signup-client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import { validateCpfPhonePlatform } from "@/lib/validate-cpf-phone-platform";
import { validateAndResizeAvatar, type AvatarValidationError } from "@/lib/utils/avatarUpload";
import { toast } from "sonner";
import { MSG_EMAIL } from "@/lib/duplicate-messages";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";
import { logger } from "@/lib/sentry";

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

interface UpdateMyProfileParams {
  userId: string;
  avatar_url?: string | null;
}

interface UploadAvatarParams {
  userId: string;
  file: File;
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

export interface InviteUserBody {
  email: string;
  password?: string;
  full_name: string;
  role: "admin" | "student" | "teacher";
  teacher_id?: string | null;
  teacherId?: string | null;
  studentId?: string | null;
  teacherData?: Partial<TeacherInsert>;
  studentData?: Partial<StudentInsert>;
}

export interface InviteUserResult {
  userId: string;
  email: string;
  password: string;
  createdStudent: { id: string } | null;
  createdTeacher: { id: string } | null;
  permissionsWarning?: boolean;
}

function isEdgeFunctionNetworkError(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? "";
  return (
    msg.includes("failed to send") ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("load failed") ||
    msg.includes("connection refused")
  );
}

async function getFunctionError(err: unknown): Promise<string | null> {
  const e = err as { context?: { json?: () => Promise<{ error?: string }>; body?: unknown } };
  if (e?.context?.json) {
    try {
      const body = await e.context.json();
      if (body?.error && typeof body.error === "string") return body.error;
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function invokeInviteUser(body: InviteUserBody): Promise<InviteUserResult> {
  try {
    const { data, error } = await supabase.functions.invoke("invite-user", { body });
    const parsed = data as { error?: string; userId?: string; email?: string; password?: string; createdStudent?: { id: string } | null; createdTeacher?: { id: string } | null; permissionsWarning?: boolean } | null;
    if (parsed?.userId && parsed?.password) {
      return {
        userId: parsed.userId,
        email: parsed.email ?? body.email,
        password: parsed.password,
        createdStudent: parsed.createdStudent ?? null,
        createdTeacher: parsed.createdTeacher ?? null,
        permissionsWarning: parsed.permissionsWarning ?? false,
      };
    }
    if (parsed?.error) throw new Error(parsed.error);
    if (error) {
      const fnMsg = await getFunctionError(error);
      throw new Error(fnMsg || (error as Error).message || "Erro ao criar usuário");
    }
    throw new Error("Resposta inválida da função");
  } catch (err) {
    if (isEdgeFunctionNetworkError(err)) {
      return createUserLegacy(body);
    }
    const fnMsg = await getFunctionError(err);
    if (fnMsg) throw new Error(fnMsg);
    if (err instanceof Error) throw err;
    throw new Error("Erro ao criar usuário");
  }
}

// Fallback quando Edge Function indisponível (não deployada, rede, etc.)
async function createUserLegacy(body: InviteUserBody): Promise<InviteUserResult> {
  const fullName = body.full_name;
  const normalizedEmail = body.email.trim().toLowerCase();
  const password = (body.password && body.password.length >= 6) ? body.password : generateRandomPassword();

  const { data: existingProfile } = await supabase.from("profiles").select("id").ilike("email", normalizedEmail).maybeSingle();
  if (existingProfile) throw new Error(MSG_EMAIL);

  let createdStudent: { id: string } | null = null;
  let createdTeacher: { id: string } | null = null;
  let resolvedStudentId = body.studentId ?? null;
  let resolvedTeacherId = body.teacherId ?? body.teacher_id ?? null;

  if (body.role === "student") {
    if (body.studentId) {
      resolvedStudentId = body.studentId;
    } else if (body.studentData) {
      const err = await validateCpfPhonePlatform(supabase, body.studentData);
      if (err) throw new Error(err);
      const insert: StudentInsert = { ...body.studentData, name: fullName, email: normalizedEmail } as StudentInsert;
      const { data: s, error: se } = await supabase.from("students").insert(insert).select("id").single();
      if (se) throw new Error(getDuplicateErrorMessage(se) || se.message);
      if (s?.id) { createdStudent = { id: s.id }; resolvedStudentId = s.id; }
    } else {
      throw new Error("studentId ou studentData é obrigatório para role student");
    }
  } else if (body.role === "teacher") {
    if (body.teacherId) {
      resolvedTeacherId = body.teacherId;
    } else if (body.teacherData) {
      const err = await validateCpfPhonePlatform(supabase, body.teacherData);
      if (err) throw new Error(err);
      const insert: TeacherInsert = { ...body.teacherData, name: fullName, email: normalizedEmail } as TeacherInsert;
      const { data: t, error: te } = await supabase.from("teachers").insert(insert).select("id").single();
      if (te) throw new Error(getDuplicateErrorMessage(te) || te.message);
      if (t?.id) { createdTeacher = { id: t.id }; resolvedTeacherId = t.id; }
    } else {
      throw new Error("teacherId ou teacherData é obrigatório para role teacher");
    }
  }

  const { data: authData, error: authError } = await supabaseSignupClient.auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error("Falha ao criar usuário");
  const userId = authData.user.id;

  for (let i = 0; i < 8; i++) {
    const { data: p } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
    if (p) break;
    await new Promise((r) => setTimeout(r, 150 + i * 100));
  }
  await new Promise((r) => setTimeout(r, 400));

  let roleOk = false;
  const { error: rpcErr } = await supabase.rpc("set_user_role", {
    p_user_id: userId,
    p_role: body.role,
    p_full_name: fullName,
    p_email: normalizedEmail,
    p_teacher_id: resolvedTeacherId ?? undefined,
    p_student_id: resolvedStudentId ?? undefined,
  });
  if (!rpcErr) roleOk = true;
  if (!roleOk) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ role: body.role, full_name: fullName, email: normalizedEmail, student_id: resolvedStudentId, teacher_id: resolvedTeacherId })
      .eq("user_id", userId);
    const { error: rolesErr } = await supabase.rpc("upsert_user_role_safe", {
      p_user_id: userId,
      p_role: body.role,
      p_full_name: fullName || null,
      p_email: normalizedEmail,
    });
    if (!profileErr && !rolesErr) roleOk = true;
  }

  return {
    userId,
    email: normalizedEmail,
    password,
    createdStudent,
    createdTeacher,
    permissionsWarning: !roleOk,
  };
}

// Create a new user (via Edge Function invite-user)
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
      const finalPassword = (!password || password.length < 6) ? generateRandomPassword() : password;

      const body: Parameters<typeof invokeInviteUser>[0] = {
        email: normalizedEmail,
        password: finalPassword,
        full_name: fullName || normalizedEmail,
        role,
      };

      if (role === "student" && studentData) {
        body.studentData = { ...studentData, name: studentData.name || fullName, email: normalizedEmail };
      }
      if (role === "teacher" && teacherData) {
        body.teacherData = { ...teacherData, name: teacherData.name || fullName, email: normalizedEmail };
      }

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
      if (result?.permissionsWarning) {
        toast.warning("Usuário criado. Ajuste as permissões manualmente na aba Usuários se necessário.");
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      if (variables.role === "student" || result?.createdStudent) {
        queryClient.invalidateQueries({ queryKey: ["students"] });
      }
      if (variables.role === "teacher" || result?.createdTeacher) {
        queryClient.invalidateQueries({ queryKey: ["teachers"] });
      }
    },
    onError: (error: Error, variables) => {
      logger.error(error, {
        context: "useCreateUser",
        email: variables.email,
        role: variables.role,
      });
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

      const { error } = await supabase.rpc("upsert_user_role_safe", {
        p_user_id: userId,
        p_role: role,
        p_full_name: fullName || null,
        p_email: normalizedEmail,
      });
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

        if (studentError) {
          const friendly = getDuplicateErrorMessage(studentError);
          throw new Error(friendly || studentError.message);
        }
        if (student?.id) {
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

        if (teacherError) {
          const friendly = getDuplicateErrorMessage(teacherError);
          throw new Error(friendly || teacherError.message);
        }
        if (teacher?.id) {
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
      toast.error(error.message || "Erro ao atualizar privilégio. Tente novamente.");
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

/** Atualiza avatar (e opcionalmente outros campos) do próprio perfil. */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, avatar_url }: UpdateMyProfileParams) => {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatar_url ?? null })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["current_user_profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Foto de perfil atualizada.");
    },
    onError: (err: Error) => {
      const message =
        err?.message && String(err.message).trim()
          ? String(err.message)
          : "Erro ao atualizar foto. Tente novamente.";
      toast.error(message);
    },
  });
}

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function getExtensionFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpeg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpeg";
}

function getContentTypeForUpload(file: File, blob: Blob): string {
  const t = blob.type || file.type;
  if (ALLOWED_AVATAR_TYPES.includes(t as (typeof ALLOWED_AVATAR_TYPES)[number])) return t;
  return "image/jpeg";
}

/** Upload de foto de perfil: valida (tamanho + px), redimensiona se necessário, envia para Storage e atualiza profiles.avatar_url. */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, file }: UploadAvatarParams): Promise<void> => {
      const blob = await validateAndResizeAvatar(file).catch((err: AvatarValidationError) => {
        toast.error(err.message);
        throw err;
      });
      const contentType = getContentTypeForUpload(file, blob);
      const ext = getExtensionFromMime(contentType);
      const path = `${userId}/avatar.${ext}`;
      const fileToUpload = new File([blob], `avatar.${ext}`, { type: contentType });

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, fileToUpload, { upsert: true, contentType });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["current_user_profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Foto de perfil atualizada.");
    },
    onError: (err: Error) => {
      if (err && typeof err === "object" && "code" in err && (err as AvatarValidationError).code) return;
      const message =
        err?.message && String(err.message).trim()
          ? String(err.message)
          : "Erro ao enviar foto. Tente novamente.";
      toast.error(message);
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
      toast.success("Usuário arquivado com sucesso!");
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

/** Redefinir senha de um usuário (admin via Edge Function). Usa fetch para garantir envio do Authorization. */
export function useAdminResetPassword() {
  return useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      // Em dev usa proxy (same-origin) para evitar CORS; em prod chama Supabase direto
      const functionsBase = import.meta.env.DEV && typeof window !== "undefined"
        ? `${window.location.origin}/supabase-functions`
        : `${SUPABASE_URL}/functions/v1`;
      const url = `${functionsBase}/admin-reset-password`;
      
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            userId,
            password,
            accessToken: session.access_token,
          }),
        });
        
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        
        if (!res.ok) {
          throw new Error(data?.error ?? (res.statusText || "Erro ao redefinir senha."));
        }
        if (data?.error) throw new Error(data.error);
      } catch (err) {
        console.error("[useAdminResetPassword] Erro:", err);
        if (isEdgeFunctionNetworkError(err)) {
          throw new Error(
            "Não foi possível contactar o servidor. Verifique sua conexão e se a Edge Function 'admin-reset-password' está publicada no projeto Supabase."
          );
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao redefinir senha. Tente novamente.");
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

      const { error: roleError } = await supabase.rpc("upsert_user_role_safe", {
        p_user_id: userId,
        p_role: "student",
        p_full_name: fullName,
        p_email: email,
      });
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

      const { error: roleError } = await supabase.rpc("upsert_user_role_safe", {
        p_user_id: userId,
        p_role: "teacher",
        p_full_name: fullName,
        p_email: email,
      });
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


// Convida aluno (cria student + auth user atomicamente via invite-user)
export function useInviteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StudentInsert & { teacher_id?: string | null }) => {
      const email = (data.email ?? "").trim().toLowerCase();
      if (!email) throw new Error("Email é obrigatório");
      const result = await invokeInviteUser({
        email,
        full_name: data.name,
        role: "student",
        teacher_id: data.teacher_id ?? undefined,
        studentData: data as Partial<StudentInsert>,
      });
      return { ...result, createdStudent: result.createdStudent ?? { id: "" } };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      if (data?.permissionsWarning) {
        toast.warning("Aluno criado. Ajuste as permissões na aba Usuários se necessário.");
      } else {
        toast.success("Aluno e conta de acesso criados com sucesso!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao convidar aluno.");
    },
  });
}

// Convida professor (cria teacher + auth user atomicamente via invite-user)
export function useInviteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TeacherInsert) => {
      const email = (data.email ?? "").trim().toLowerCase();
      if (!email) throw new Error("Email é obrigatório");
      const result = await invokeInviteUser({
        email,
        full_name: data.name,
        role: "teacher",
        teacherData: data as Partial<TeacherInsert>,
      });
      return { ...result, createdTeacher: result.createdTeacher ?? { id: "" } };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      if (data?.permissionsWarning) {
        toast.warning("Professor criado. Ajuste as permissões na aba Usuários se necessário.");
      } else {
        toast.success("Professor e conta de acesso criados com sucesso!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao convidar professor.");
    },
  });
}

// Create auth user and link to an existing student (via Edge Function)
export function useCreateAuthUserForStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, email, fullName }: CreateAuthUserParams & { studentId: string }) => {
      const result = await invokeInviteUser({
        email: email.trim().toLowerCase(),
        full_name: fullName || email,
        role: "student",
        studentId,
      });
      return { user: { id: result.userId } as { id: string }, password: result.password };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
    },
    onError: (error: Error) => {
      const msg = error?.message?.toLowerCase() || "";
      toast.error(msg.includes("already") || msg.includes("cadastrado") ? MSG_EMAIL : error.message);
    },
  });
}

// Create auth user and link to an existing teacher (via Edge Function)
export function useCreateAuthUserForTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teacherId, email, fullName }: CreateAuthUserParams & { teacherId: string }) => {
      const result = await invokeInviteUser({
        email: email.trim().toLowerCase(),
        full_name: fullName || email,
        role: "teacher",
        teacherId,
      });
      return { user: { id: result.userId } as { id: string }, password: result.password };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
    },
    onError: (error: Error) => {
      const msg = error?.message?.toLowerCase() || "";
      toast.error(msg.includes("already") || msg.includes("cadastrado") ? MSG_EMAIL : error.message);
    },
  });
}
