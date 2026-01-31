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
  if (msg.includes("teachers_unique_cpf") || msg.includes("students_unique_cpf")) return "CPF já cadastrado";
  if (msg.includes("teachers_unique_phone") || msg.includes("students_unique_phone")) return "Telefone já cadastrado";
  if (msg.includes("students_unique_email") || (msg.includes("duplicate key") && msg.toLowerCase().includes("email"))) return "Email já cadastrado";
  return msg;
}

function normalizeDigits(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  return val.replace(/\D/g, "");
}

async function validateStudentCpfPhone(
  admin: ReturnType<typeof createClient>,
  studentData: Record<string, unknown> | undefined
): Promise<string | null> {
  if (!studentData) return null;
  const cpf = normalizeDigits(studentData.cpf as string);
  const phone = normalizeDigits(studentData.phone as string);
  if (cpf.length === 11) {
    const { data } = await admin.rpc("check_student_cpf_exists", { p_cpf_digits: cpf });
    if (data === true) return "CPF já cadastrado";
  }
  if (phone.length >= 10) {
    const { data } = await admin.rpc("check_student_phone_exists", { p_phone_digits: phone });
    if (data === true) return "Telefone já cadastrado";
  }
  return null;
}

async function validateTeacherCpfPhone(
  admin: ReturnType<typeof createClient>,
  teacherData: Record<string, unknown> | undefined
): Promise<string | null> {
  if (!teacherData) return null;
  const cpf = normalizeDigits(teacherData.cpf as string);
  const phone = normalizeDigits(teacherData.phone as string);
  if (cpf.length === 11) {
    const { data } = await admin.rpc("check_teacher_cpf_exists", { p_cpf_digits: cpf });
    if (data === true) return "CPF já cadastrado";
  }
  if (phone.length >= 10) {
    const { data } = await admin.rpc("check_teacher_phone_exists", { p_phone_digits: phone });
    if (data === true) return "Telefone já cadastrado";
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

  const authHeader = req.headers.get("Authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    log("No Authorization header");
    return jsonResponse({ error: "Não autenticado" }, 401);
  }

  const supabaseAuthed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: { user: caller }, error: authError } = await supabaseAuthed.auth.getUser(jwt);
  if (authError || !caller) {
    log("Not authenticated", { error: authError?.message });
    return jsonResponse({ error: "Não autenticado" }, 401);
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
  } catch {
    return jsonResponse({ error: "Corpo JSON inválido" }, 400);
  }

  const { email, full_name, role, teacher_id, teacherId, studentId, teacherData, studentData } = body;
  const normalizedEmail = (email ?? "").trim().toLowerCase();

  if (!normalizedEmail || !full_name || !role || !ROLES.includes(role)) {
    return jsonResponse({ error: "email, full_name e role são obrigatórios" }, 400);
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

  if (role === "student" && !studentId) {
    const err = await validateStudentCpfPhone(supabaseAdmin, studentData as Record<string, unknown> | undefined);
    if (err) return jsonResponse({ error: err }, 400);
  }
  if (role === "teacher" && !teacherId) {
    const err = await validateTeacherCpfPhone(supabaseAdmin, teacherData as Record<string, unknown> | undefined);
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
    const friendly = createError.message?.toLowerCase().includes("already") ? "Email já cadastrado" : createError.message;
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
      const insertData: Record<string, unknown> = {
        name: full_name,
        email: normalizedEmail,
        teacher_id: tid ?? null,
        ...sd,
      };
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
      const insertData: Record<string, unknown> = {
        name: full_name,
        email: normalizedEmail,
        ...td,
      };
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
