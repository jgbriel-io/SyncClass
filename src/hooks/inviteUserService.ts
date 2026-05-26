import { supabase } from "@/integrations/supabase/client";
import { supabaseSignupClient } from "@/integrations/supabase/signup-client";
import { getDuplicateErrorMessage } from "@/lib/duplicate-error";
import { validatePhonePlatform } from "@/hooks/validatePhonePlatformService";
import { isValidEmailFormat } from "@/lib/utils/patterns";
import { common } from "@/content";
import type { TablesInsert } from "@/integrations/supabase/types";

type StudentInsert = TablesInsert<"students">;
type TeacherInsert = TablesInsert<"teachers">;

// ─── Tipos públicos ───────────────────────────────────────────────────────────

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

// ─── Helpers internos ─────────────────────────────────────────────────────────

type InviteResponseBody = {
  error?: string;
  userId?: string;
  email?: string;
  password?: string;
  createdStudent?: { id: string } | null;
  createdTeacher?: { id: string } | null;
  permissionsWarning?: boolean;
};

export function isEdgeFunctionNetworkError(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? "";
  return (
    msg.includes("failed to send") ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("load failed") ||
    msg.includes("connection refused")
  );
}

/** Obtém o body da resposta da Edge Function quando ela retorna 4xx/5xx (vem em error.context). */
async function getFunctionResponseBody(
  err: unknown
): Promise<InviteResponseBody | null> {
  const e = err as {
    context?: { json?: () => Promise<InviteResponseBody>; body?: unknown };
  };
  if (e?.context?.json) {
    try {
      return await e.context.json();
    } catch {
      /* body já lido */
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

/**
 * Se a função retornou erro mas criou o usuário (ex.: 500 após falha em profile/roles),
 * trata como sucesso parcial. Nunca para 4xx.
 */
export function inviteResultFromBody(
  body: InviteResponseBody,
  bodyEmail: string
): InviteUserResult | null {
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

// ─── Funções públicas ─────────────────────────────────────────────────────────

/** Gera senha criptograficamente segura. */
export function generateRandomPassword(length: number = 12): string {
  const lowercase = "abcdefghijkmnpqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  const all = lowercase + uppercase + numbers + symbols;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = "";
  // Garantir pelo menos 1 de cada tipo
  password += lowercase[array[0] % lowercase.length];
  password += uppercase[array[1] % uppercase.length];
  password += numbers[array[2] % numbers.length];
  password += symbols[array[3] % symbols.length];

  for (let i = 4; i < length; i++) {
    password += all[array[i] % all.length];
  }

  // Embaralhar com Fisher-Yates usando valores criptográficos
  const chars = password.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export function validateEmailForInvite(email: string): void {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error("Email é obrigatório");
  if (!isValidEmailFormat(trimmed)) throw new Error("Email inválido");
}

/** Chama a Edge Function invite-user. Faz fallback para createUserLegacy em erros de rede. */
export async function invokeInviteUser(
  body: InviteUserBody
): Promise<InviteUserResult> {
  validateEmailForInvite(body.email);
  const {
    data: { session },
  } = await supabase.auth.getSession();
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
    if (parsed?.error) throw new Error(parsed.error);
    if (error) {
      const errorBody = await getFunctionResponseBody(error);
      const partial = errorBody
        ? inviteResultFromBody(errorBody, body.email)
        : null;
      if (partial) return partial;
      const msg =
        errorBody?.error ?? (error as Error).message ?? "Erro ao criar usuário";
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

/**
 * Fallback quando Edge Function indisponível (não deployada, rede, etc.).
 * Ordem igual à Edge Function: auth primeiro; só depois insert em teachers/students.
 */
export async function createUserLegacy(
  body: InviteUserBody
): Promise<InviteUserResult> {
  validateEmailForInvite(body.email);
  const fullName = body.full_name;
  const normalizedEmail = body.email.trim().toLowerCase();
  const password =
    body.password && body.password.length >= 6
      ? body.password
      : generateRandomPassword();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();
  if (existingProfile) throw new Error(common.errors.duplicateEmail);

  if (body.role === "teacher" && !body.teacherId && body.teacherData) {
    const { data: existingTeacher } = await supabase
      .from("teachers")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    if (existingTeacher) throw new Error(common.errors.duplicateEmail);
  }
  if (body.role === "student" && !body.studentId && body.studentData) {
    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    if (existingStudent) throw new Error(common.errors.duplicateEmail);
  }

  const { data: authData, error: authError } =
    await supabaseSignupClient.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: fullName, role: body.role },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
  if (authError) {
    const msg = authError.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("already been registered"))
      throw new Error(common.errors.duplicateEmail);
    throw authError;
  }
  if (!authData.user) throw new Error("Falha ao criar usuário");
  const userId = authData.user.id;

  // Aguardar profile ser criado pelo trigger
  for (let i = 0; i < 8; i++) {
    const { data: p } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
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
      const err = await validatePhonePlatform(supabase, body.studentData);
      if (err) throw new Error(err);
      const insert: StudentInsert = {
        ...body.studentData,
        name: fullName,
        email: normalizedEmail,
      } as StudentInsert;
      const { data: s, error: se } = await supabase
        .from("students")
        .insert(insert)
        .select("id")
        .single();
      if (se) throw new Error(getDuplicateErrorMessage(se) || se.message);
      if (s?.id) {
        createdStudent = { id: s.id };
        resolvedStudentId = s.id;
      }
    } else {
      throw new Error(
        "studentId ou studentData é obrigatório para role student"
      );
    }
  } else if (body.role === "teacher") {
    if (body.teacherId) {
      resolvedTeacherId = body.teacherId;
    } else if (body.teacherData) {
      const err = await validatePhonePlatform(supabase, body.teacherData);
      if (err) throw new Error(err);
      const insert: TeacherInsert = {
        ...body.teacherData,
        name: fullName,
        email: normalizedEmail,
      } as TeacherInsert;
      const { data: t, error: te } = await supabase
        .from("teachers")
        .insert(insert)
        .select("id")
        .single();
      if (te) throw new Error(getDuplicateErrorMessage(te) || te.message);
      if (t?.id) {
        createdTeacher = { id: t.id };
        resolvedTeacherId = t.id;
      }
    } else {
      throw new Error(
        "teacherId ou teacherData é obrigatório para role teacher"
      );
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
      .update({
        role: body.role,
        full_name: fullName,
        email: normalizedEmail,
        student_id: resolvedStudentId,
        teacher_id: resolvedTeacherId,
      })
      .eq("user_id", userId);
    const { error: rolesErr } = await supabase.rpc("upsert_user_role_safe", {
      p_user_id: userId,
      p_role: body.role,
      p_full_name: fullName || null,
      p_email: normalizedEmail,
    });
    if (!profileErr && !rolesErr) roleOk = true;
    else if (profileErr && rolesErr) {
      throw new Error(
        `Usuário criado mas sem role atribuída: ${rolesErr.message}`
      );
    }
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
