// Edge Function: invite-user
// Cadastro atômico de usuários (auth + profiles + user_roles + students/teachers)
// Admin: pode convidar qualquer role. Teacher: apenas students (com teacher_id próprio)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROLES = ["admin", "student", "teacher"] as const;
type Role = (typeof ROLES)[number];

function log(msg: string, data?: Record<string, unknown>) {
  console.log(`[invite-user] ${msg}`, data ?? "");
}

function randomPassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < length; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  return p;
}

function friendlyDuplicateError(msg: string): string {
  if (msg.includes("CPF já cadastrado na plataforma") || msg.includes("teachers_unique_cpf") || msg.includes("students_unique_cpf")) return "CPF já cadastrado na plataforma";
  if (msg.includes("Telefone já cadastrado na plataforma") || msg.includes("teachers_unique_phone") || msg.includes("students_unique_phone")) return "Telefone já cadastrado na plataforma";
  if (msg.includes("students_unique_email") || (msg.includes("duplicate key") && msg.toLowerCase().includes("email"))) return "Email já cadastrado";
  return msg;
}

function normalizeDigits(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  return val.replace(/\D/g, "");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 255;

const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "outlook.com", "hotmail.com", "hotmail.com.br", "live.com", "live.com.br", "outlook.com.br", "outlook.pt", "msn.com",
  "yahoo.com", "yahoo.com.br", "ymail.com",
  "icloud.com", "me.com", "mac.com",
  "protonmail.com", "proton.me",
  "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br",
  "aol.com", "zoho.com", "mail.com", "i.ua", "inbox.com",
]);

function getEmailDomain(email: string): string {
  const trimmed = email?.trim()?.toLowerCase() ?? "";
  const i = trimmed.lastIndexOf("@");
  return i >= 0 ? trimmed.slice(i + 1) : "";
}

function isValidEmailFormat(email: string): boolean {
  const trimmed = email?.trim() ?? "";
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX_LENGTH) return false;
  return EMAIL_REGEX.test(trimmed);
}

function isAllowedEmailDomain(email: string): boolean {
  const domain = getEmailDomain(email);
  return domain.length > 0 && ALLOWED_EMAIL_DOMAINS.has(domain);
}

// Remove empty strings and convert them to null to avoid unique index conflicts
function cleanInsertData(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === "" || value === undefined) {
      // Skip empty strings and undefined to let DB handle defaults
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

// Validação platform-wide: CPF e telefone únicos em students + teachers
async function validateCpfPhonePlatform(
  admin: ReturnType<typeof createClient>,
  data: Record<string, unknown> | undefined
): Promise<string | null> {
  if (!data) return null;
  const cpf = normalizeDigits(data.cpf as string);
  const phone = normalizeDigits(data.phone as string);
  
  // Validar comprimento do CPF (deve ter exatamente 11 dígitos)
  if (cpf && cpf.length > 0 && cpf.length !== 11) {
    return "CPF deve ter exatamente 11 dígitos";
  }
  
  // Validar comprimento do telefone (deve ter 10 ou 11 dígitos)
  if (phone && phone.length > 0 && (phone.length < 10 || phone.length > 11)) {
    return "Telefone deve ter 10 ou 11 dígitos";
  }
  
  if (cpf.length === 11) {
    const { data: cpfExists } = await admin.rpc("check_cpf_exists_platform", { p_cpf_digits: cpf });
    if (cpfExists === true) return "CPF já cadastrado na plataforma";
  }
  if (phone.length >= 10) {
    const { data: phoneExists } = await admin.rpc("check_phone_exists_platform", { p_phone_digits: phone });
    if (phoneExists === true) return "Telefone já cadastrado na plataforma";
  }
  return null;
}

async function rollbackAuthUser(admin: ReturnType<typeof createClient>, userId: string): Promise<void> {
  try {
    await admin.auth.admin.deleteUser(userId);
    log("Rollback: auth user deleted", { userId });
  } catch (e) {
    log("Rollback failed to delete auth user", { userId, error: (e as Error).message });
  }
}

async function waitForProfile(userId: string, admin: ReturnType<typeof createClient>, maxAttempts = 8): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await admin.from("profiles").select("id").eq("user_id", userId).maybeSingle();
    if (data) return;
    await new Promise((r) => setTimeout(r, 150 + i * 100));
  }
  throw new Error("Perfil não foi criado a tempo. Tente novamente.");
}

function jsonResponse(data: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    log("Missing Supabase env vars");
    return jsonResponse({ error: "Configuração do servidor incompleta" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    log("No Authorization header");
    return jsonResponse({ error: "Não autenticado. Envie o header Authorization com o token do usuário logado." }, 401);
  }

  const supabaseAuthed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader! } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: { user: caller }, error: authError } = await supabaseAuthed.auth.getUser(jwt);
  if (authError || !caller) {
    log("Not authenticated", { error: authError?.message, hasJwt: !!jwt });
    const detail = authError?.message ?? (caller ? null : "Usuário não encontrado");
    return jsonResponse({
      error: "Não autenticado",
      ...(detail && { detail }),
    }, 401);
  }

  const { data: callerRoleRow } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .maybeSingle();

  let callerRole: Role | null = null;
  if (callerRoleRow?.role && ROLES.includes(callerRoleRow.role as Role)) {
    callerRole = callerRoleRow.role as Role;
  } else {
    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("role, teacher_id")
      .eq("user_id", caller.id)
      .maybeSingle();
    if (profileRow?.role && ROLES.includes(profileRow.role as Role)) callerRole = profileRow.role as Role;
  }

  const callerTeacherId = callerRole === "teacher"
    ? (await supabaseAdmin.from("profiles").select("teacher_id").eq("user_id", caller.id).maybeSingle()).data?.teacher_id as string | null
    : null;

  interface Body {
    email: string;
    password?: string;
    full_name: string;
    role: Role;
    teacher_id?: string | null;
    teacherId?: string | null;
    studentId?: string | null;
    teacherData?: Record<string, unknown>;
    studentData?: Record<string, unknown>;
  }

  let body: Body;
  try {
    body = await req.json();
    log("Request body received", { email: body.email, role: body.role, hasTeacherData: !!body.teacherData, hasStudentData: !!body.studentData });
  } catch (err) {
    log("Failed to parse JSON body", { error: (err as Error).message });
    return jsonResponse({ error: "Corpo JSON inválido" }, 400);
  }

  const { email, full_name, role, teacher_id, teacherId, studentId, teacherData, studentData } = body;
  const rawEmail = (email ?? "").trim();
  if (!rawEmail) {
    log("Missing email");
    return jsonResponse({ error: "Email é obrigatório" }, 400);
  }
  if (!isValidEmailFormat(rawEmail)) {
    log("Invalid email format", { email: rawEmail });
    return jsonResponse({ error: "Email inválido" }, 400);
  }
  if (!isAllowedEmailDomain(rawEmail)) {
    log("Email domain not allowed", { email: rawEmail });
    return jsonResponse({ error: "Use um email de provedor real (Gmail, Outlook, Yahoo, etc.)" }, 400);
  }
  const normalizedEmail = rawEmail.toLowerCase();

  if (!full_name || !role || !ROLES.includes(role)) {
    log("Missing required fields", { full_name, role, roleValid: ROLES.includes(role as Role) });
    return jsonResponse({ error: "Nome completo e tipo de conta são obrigatórios" }, 400);
  }

  if (callerRole === "teacher") {
    if (role !== "student") {
      log("Teacher tried to invite non-student", { role });
      return jsonResponse({ error: "Professores só podem convidar alunos" }, 403);
    }
    const effectiveTeacherId = teacher_id ?? teacherId ?? (studentData as Record<string, unknown> | undefined)?.teacher_id;
    if (!effectiveTeacherId || effectiveTeacherId !== callerTeacherId) {
      log("Teacher context mismatch", { effectiveTeacherId, callerTeacherId });
      return jsonResponse({ error: "Aluno deve ser vinculado ao seu perfil de professor" }, 403);
    }
  } else if (callerRole !== "admin") {
    log("Caller is not admin or teacher", { callerRole });
    return jsonResponse({ error: "Sem permissão para convidar usuários" }, 403);
  }

  const password = (body.password && body.password.length >= 6) ? body.password : randomPassword();

  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    return jsonResponse({ error: "Email já cadastrado" }, 400);
  }

  if (role === "teacher" && !teacherId) {
    const { data: existingTeacher } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    if (existingTeacher) {
      return jsonResponse({ error: "Email já cadastrado" }, 400);
    }
  }
  if (role === "student" && !studentId) {
    const { data: existingStudent } = await supabaseAdmin
      .from("students")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    if (existingStudent) {
      return jsonResponse({ error: "Email já cadastrado" }, 400);
    }
  }

  if (role === "student" && !studentId) {
    const err = await validateCpfPhonePlatform(supabaseAdmin, studentData as Record<string, unknown> | undefined);
    if (err) return jsonResponse({ error: err }, 400);
  }
  if (role === "teacher" && !teacherId) {
    const err = await validateCpfPhonePlatform(supabaseAdmin, teacherData as Record<string, unknown> | undefined);
    if (err) return jsonResponse({ error: err }, 400);
  }

  log("Creating auth user", { email: normalizedEmail, role });

  const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createError) {
    const msg = createError.message ?? "";
    const friendly = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("already been registered")
      ? "Email já cadastrado"
      : msg;
    log("Auth createUser failed", { error: createError.message });
    return jsonResponse({ error: friendly }, 400);
  }

  if (!authUser.user) {
    log("Auth user null after create");
    return jsonResponse({ error: "Falha ao criar usuário" }, 500);
  }

  const userId = authUser.user.id;

  try {
    await waitForProfile(userId, supabaseAdmin);
  } catch (err) {
    log("Profile wait failed", { error: (err as Error).message });
    return jsonResponse({ error: (err as Error).message, userId, password, permissionsWarning: true }, 500);
  }

  let resolvedStudentId: string | null = studentId ?? null;
  let resolvedTeacherId: string | null = teacherId ?? null;

  if (role === "student") {
    if (studentId) {
      resolvedStudentId = studentId;
    } else {
      const sd = (studentData ?? {}) as Record<string, unknown>;
      const tid = (teacher_id ?? teacherId ?? sd.teacher_id) as string | undefined;
      const rawInsertData: Record<string, unknown> = {
        name: full_name,
        email: normalizedEmail,
        teacher_id: tid ?? null,
        ...sd,
      };
      const insertData = cleanInsertData(rawInsertData);
      const { data: student, error: studentErr } = await supabaseAdmin
        .from("students")
        .insert(insertData)
        .select("id")
        .single();

      if (studentErr) {
        const friendly = friendlyDuplicateError(studentErr.message);
        log("Student insert failed, rolling back", { error: studentErr.message });
        await rollbackAuthUser(supabaseAdmin, userId);
        return jsonResponse({ error: friendly || studentErr.message }, 400);
      }
      resolvedStudentId = student?.id ?? null;
    }
  }

  if (role === "teacher") {
    if (teacherId) {
      resolvedTeacherId = teacherId;
    } else {
      const td = (teacherData ?? {}) as Record<string, unknown>;
      const rawInsertData: Record<string, unknown> = {
        name: full_name,
        email: normalizedEmail,
        ...td,
      };
      const insertData = cleanInsertData(rawInsertData);
      const { data: teacher, error: teacherErr } = await supabaseAdmin
        .from("teachers")
        .insert(insertData)
        .select("id")
        .single();

      if (teacherErr) {
        const friendly = friendlyDuplicateError(teacherErr.message);
        log("Teacher insert failed, rolling back", { error: teacherErr.message });
        await rollbackAuthUser(supabaseAdmin, userId);
        return jsonResponse({ error: friendly || teacherErr.message }, 400);
      }
      resolvedTeacherId = teacher?.id ?? null;
    }
  }

  const profileUpdate: Record<string, unknown> = {
    role,
    full_name,
    email: normalizedEmail,
    teacher_id: role === "teacher" ? resolvedTeacherId : null,
    student_id: role === "student" ? resolvedStudentId : null,
  };

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update(profileUpdate)
    .eq("user_id", userId);

  if (profileErr) {
    log("Profile update failed", { error: profileErr.message });
    return jsonResponse({ error: profileErr.message, userId, password, permissionsWarning: true }, 500);
  }

  const { error: rolesErr } = await supabaseAdmin
    .from("user_roles")
    .update({ role, full_name, email: normalizedEmail })
    .eq("user_id", userId);

  if (rolesErr) {
    log("user_roles update failed", { error: rolesErr.message });
    return jsonResponse({ error: rolesErr.message, userId, password, permissionsWarning: true }, 500);
  }

  log("User created successfully", { userId, role });

  return jsonResponse({
    success: true,
    userId,
    email: normalizedEmail,
    password,
    createdStudent: role === "student" && resolvedStudentId ? { id: resolvedStudentId } : null,
    createdTeacher: role === "teacher" && resolvedTeacherId ? { id: resolvedTeacherId } : null,
  }, 200);
});
