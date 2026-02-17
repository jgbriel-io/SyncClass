import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/integrations/supabase/env";
import { supabaseSignupClient } from "@/integrations/supabase/signup-client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import { validateCpfPhonePlatform } from "@/lib/validate-cpf-phone-platform";
import { isValidEmailFormat } from "@/lib/utils/patterns";
import { isAllowedEmailDomain } from "@/lib/validation/email";
import { validateAndResizeAvatar, type AvatarValidationError } from "@/lib/utils/avatarUpload";
import { toast } from "sonner";
import { MSG_EMAIL } from "@/lib/duplicate-messages";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";
import { logger } from "@/lib/sentry";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";

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

// Helper function to generate cryptographically secure random password
function generateRandomPassword(length: number = 12): string {
  const lowercase = "abcdefghijkmnpqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  const all = lowercase + uppercase + numbers + symbols;
  
  // Usar crypto.getRandomValues para segurança criptográfica
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  let password = "";
  
  // Garantir pelo menos 1 de cada tipo
  password += lowercase[array[0] % lowercase.length];
  password += uppercase[array[1] % uppercase.length];
  password += numbers[array[2] % numbers.length];
  password += symbols[array[3] % symbols.length];
  
  // Preencher o resto
  for (let i = 4; i < length; i++) {
    password += all[array[i] % all.length];
  }
  
  // Embaralhar usando Fisher-Yates com valores criptográficos
  const chars = password.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  
  return chars.join('');
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

type InviteResponseBody = {
  error?: string;
  userId?: string;
  email?: string;
  password?: string;
  createdStudent?: { id: string } | null;
  createdTeacher?: { id: string } | null;
  permissionsWarning?: boolean;
};

async function getFunctionError(err: unknown): Promise<string | null> {
  const body = await getFunctionResponseBody(err);
  if (body?.error && typeof body.error === "string") return body.error;
  return null;
}

/** Obtém o body da resposta da Edge Function quando ela retorna 4xx/5xx (vem em error.context). */
async function getFunctionResponseBody(err: unknown): Promise<InviteResponseBody | null> {
  const e = err as { context?: { json?: () => Promise<InviteResponseBody>; body?: unknown } };
  
  if (e?.context?.json) {
    try {
      const result = await e.context.json();
      return result;
    } catch (jsonErr) {
      /* ignore - body already read */
    }
  }
  return null;
}

/** Erros que indicam 4xx (nunca tratar como sucesso parcial). */
function isClientError(body: InviteResponseBody): boolean {
  const err = (body?.error ?? "").toLowerCase();
  return (
    err.includes("já cadastrado") ||
    err.includes("inválido") ||
    err.includes("already")
  );
}

/** Se a função retornou erro mas criou o usuário (ex.: 500 após falha em profile/roles), trata como sucesso parcial. Nunca para 4xx. */
function inviteResultFromBody(body: InviteResponseBody, bodyEmail: string): InviteUserResult | null {
  if (isClientError(body)) return null;
  if (body?.userId && body?.password) {
    return {
      userId: body.userId,
      email: body.email ?? bodyEmail,
      password: body.password,
      createdStudent: body.createdStudent ?? null,
      createdTeacher: body.createdTeacher ?? null,
      permissionsWarning: body.permissionsWarning ?? true,
    };
  }
  return null;
}

function validateEmailForInvite(email: string): void {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error("Email é obrigatório");
  if (!isValidEmailFormat(trimmed)) throw new Error("Email inválido");
  if (!isAllowedEmailDomain(trimmed)) throw new Error("Use um email de provedor real (Gmail, Outlook, Yahoo, etc.)");
}

async function invokeInviteUser(body: InviteUserBody): Promise<InviteUserResult> {
  validateEmailForInvite(body.email);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  try {
    const { data, error } = await supabase.functions.invoke("invite-user", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const parsed = data as InviteResponseBody | null;
    
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
    if (parsed?.error) {
      throw new Error(parsed.error);
    }
    if (error) {
      const errorBody = await getFunctionResponseBody(error);
      const partial = errorBody ? inviteResultFromBody(errorBody, body.email) : null;
      if (partial) return partial;

      const msg = errorBody?.error ?? (error as Error).message ?? "Erro ao criar usuário";
      throw new Error(msg);
    }
    throw new Error("Resposta inválida da função");
  } catch (err) {
    if (isEdgeFunctionNetworkError(err)) {
      return createUserLegacy(body);
    }
    if (err instanceof Error) throw err;
    throw new Error("Erro ao criar usuário");
  }
}

// Fallback quando Edge Function indisponível (não deployada, rede, etc.).
// Ordem igual à Edge Function: auth primeiro; só depois insert em teachers/students, para nunca deixar registro órfão.
async function createUserLegacy(body: InviteUserBody): Promise<InviteUserResult> {
  validateEmailForInvite(body.email);
  const fullName = body.full_name;
  const normalizedEmail = body.email.trim().toLowerCase();
  const password = (body.password && body.password.length >= 6) ? body.password : generateRandomPassword();

  const { data: existingProfile } = await supabase.from("profiles").select("id").ilike("email", normalizedEmail).maybeSingle();
  if (existingProfile) throw new Error(MSG_EMAIL);

  if (body.role === "teacher" && !body.teacherId && body.teacherData) {
    const { data: existingTeacher } = await supabase.from("teachers").select("id").ilike("email", normalizedEmail).maybeSingle();
    if (existingTeacher) throw new Error(MSG_EMAIL);
  }
  if (body.role === "student" && !body.studentId && body.studentData) {
    const { data: existingStudent } = await supabase.from("students").select("id").ilike("email", normalizedEmail).maybeSingle();
    if (existingStudent) throw new Error(MSG_EMAIL);
  }

  const { data: authData, error: authError } = await supabaseSignupClient.auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { full_name: fullName, role: body.role }, emailRedirectTo: `${window.location.origin}/login` },
  });
  if (authError) {
    const msg = authError.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("already been registered")) throw new Error(MSG_EMAIL);
    throw authError;
  }
  if (!authData.user) throw new Error("Falha ao criar usuário");
  const userId = authData.user.id;

  for (let i = 0; i < 8; i++) {
    const { data: p } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
    if (p) break;
    await new Promise((r) => setTimeout(r, 150 + i * 100));
  }
  await new Promise((r) => setTimeout(r, 400));

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
      // Rate limiting: 5 criações de usuário por 5 minutos
      const rateLimitResult = checkRateLimit("createUser", RATE_LIMIT_CONFIGS.AUTH);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Muitas tentativas de criação de usuário. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
        );
      }

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
      toast.error(error.message || "Não foi possível criar o usuário. Por favor, tente novamente.");
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
      // Toast removido - será mostrado no componente após ambas as operações
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível atualizar o privilégio. Por favor, tente novamente.");
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
      // Toast removido - será mostrado no componente após ambas as operações
    },
    onError: (error: Error) => {
      toast.error("Não foi possível atualizar o perfil. Por favor, tente novamente.");
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
          : "Não foi possível atualizar a foto. Por favor, tente novamente.";
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
      // Rate limiting: 5 uploads por 5 minutos
      const rateLimitResult = checkRateLimit("uploadAvatar", RATE_LIMIT_CONFIGS.UPLOAD);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Muitos uploads. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
        );
      }

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
          : "Não foi possível enviar a foto. Por favor, tente novamente.";
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
      // Toast removido - será mostrado no componente
    },
    onError: (error: Error) => {
      toast.error("Não foi possível excluir o usuário. Por favor, tente novamente.");
    },
  });
}

// Hard delete user via Edge Function (só pela aba Usuários). Remove conta + registros vinculados (student/teacher).
export function useHardDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
      });
      if (error) throw error;
      const msg = (data as { error?: string } | null)?.error;
      if (msg) throw new Error(msg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", "all"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teachers_paginated"] });
      // Toast removido - será mostrado no componente
    },
    onError: (error: Error) => {
      // Toast removido - será mostrado no componente com onError callback
    },
  });
}

/**
 * Hook unificado para redefinir senha.
 * - Admin pode enviar { userId, password } para qualquer usuário.
 * - Admin ou Professor pode enviar { studentId, password } para aluno.
 * Chama a Edge Function unificada 'reset-password'.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (params: { userId?: string; studentId?: string; password: string }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      const functionsBase = import.meta.env.DEV && typeof window !== "undefined"
        ? `${window.location.origin}/supabase-functions`
        : `${SUPABASE_URL}/functions/v1`;
      const url = `${functionsBase}/reset-password`;

      try {
        const res = await fetch(url, {
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

        if (!res.ok) {
          throw new Error(data?.error ?? (res.statusText || "Erro ao redefinir senha."));
        }
        if (data?.error) throw new Error(data.error);
      } catch (err) {
        if (isEdgeFunctionNetworkError(err)) {
          throw new Error(
            "Não foi possível contactar o servidor. Verifique sua conexão e se a Edge Function 'reset-password' está publicada no projeto Supabase."
          );
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso. O usuário precisará fazer login novamente.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível redefinir a senha. Por favor, tente novamente.");
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
      // Toast removido - será mostrado no componente
    },
    onError: (error: Error) => {
      toast.error("Não foi possível vincular o usuário ao aluno. Por favor, tente novamente.");
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
      // Toast removido - será mostrado no componente
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível vincular o usuário ao professor. Por favor, tente novamente.");
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
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      toast.success("Aluno e conta de acesso criados com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível enviar o convite ao aluno.");
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
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["teachers_paginated"] });
      toast.success("Professor e conta de acesso criados com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível enviar o convite ao professor.");
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

/** Permite que o próprio usuário autenticado redefina sua senha (senha atual + nova senha). */
export function useResetOwnPassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      const functionsBase = import.meta.env.DEV && typeof window !== "undefined"
        ? `${window.location.origin}/supabase-functions`
        : `${SUPABASE_URL}/functions/v1`;
      const url = `${functionsBase}/reset-password`;

      try {
        const res = await fetch(url, {
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

        if (!res.ok) {
          throw new Error(data?.error ?? (res.statusText || "Erro ao redefinir senha."));
        }
        if (data?.error) throw new Error(data.error);
      } catch (err) {
        if (isEdgeFunctionNetworkError(err)) {
          throw new Error(
            "Não foi possível contactar o servidor. Verifique sua conexão e se a Edge Function 'reset-password' está publicada no projeto Supabase."
          );
        }
        throw err;
      }
    },
    onSuccess: async () => {
      toast.success("Senha alterada com sucesso! Você será redirecionado para o login.");
      // Aguardar um momento para o toast ser exibido, depois limpar sessão completamente
      setTimeout(async () => {
        try {
          await supabase.auth.signOut({ scope: "global" });
        } catch (_e) {
          // ignorar erro de signOut
        }
        // Limpar todos os tokens/sessões do Supabase do localStorage
        Object.keys(localStorage)
          .filter(key => key.startsWith("sb-"))
          .forEach(key => localStorage.removeItem(key));
        // Limpar sessionStorage também
        Object.keys(sessionStorage)
          .filter(key => key.startsWith("sb-"))
          .forEach(key => sessionStorage.removeItem(key));
        // Forçar reload completo para /login (não usar router, evitar cache de estado)
        window.location.replace("/login");
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível alterar a senha. Por favor, tente novamente.");
    },
  });
}
