import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS_HEADERS, jsonResponse } from "../_shared/utils.ts";
import {
  ROLES,
  Role,
  log,
  randomPassword,
  friendlyDuplicateError,
  isValidEmailFormat,
  cleanInsertData,
} from "./helpers.ts";
import { validatePhonePlatform } from "./validation.ts";
import { rollbackAuthUser, waitForProfile } from "./auth.ts";

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

  const authHeader =
    req.headers.get("Authorization") ?? req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    log("No Authorization header");
    return jsonResponse(
      {
        error:
          "Não autenticado. Envie o header Authorization com o token do usuário logado.",
      },
      401
    );
  }

  const supabaseAuthed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader! } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user: caller },
    error: authError,
  } = await supabaseAuthed.auth.getUser(jwt);
  if (authError || !caller) {
    log("Not authenticated", { error: authError?.message, hasJwt: !!jwt });
    const detail =
      authError?.message ?? (caller ? null : "Usuário não encontrado");
    return jsonResponse(
      { error: "Não autenticado", ...(detail && { detail }) },
      401
    );
  }

  const { data: rateLimitOk, error: rateLimitError } = await supabaseAuthed.rpc(
    "check_rate_limit",
    { p_operation: "invite_user", p_max_requests: 100, p_window_minutes: 1 }
  );

  if (rateLimitError) {
    log("Rate limit check error", { error: rateLimitError.message });
  } else if (!rateLimitOk) {
    return jsonResponse(
      {
        error: "Muitos convites enviados. Aguarde 1 minuto e tente novamente.",
        retryAfter: 60,
      },
      429
    );
  }

  const { data: profileRow } = await supabaseAdmin
    .from("profiles")
    .select("role, teacher_id")
    .eq("user_id", caller.id)
    .maybeSingle();

  let callerRole: Role | null = null;
  if (profileRow?.role && ROLES.includes(profileRow.role as Role))
    callerRole = profileRow.role as Role;

  const callerTeacherId =
    callerRole === "teacher" ? (profileRow?.teacher_id as string | null) : null;

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
    log("Request body received", {
      email: body.email,
      role: body.role,
      hasTeacherData: !!body.teacherData,
      hasStudentData: !!body.studentData,
    });
  } catch (err) {
    log("Failed to parse JSON body", { error: (err as Error).message });
    return jsonResponse({ error: "Corpo JSON inválido" }, 400);
  }

  const {
    email,
    full_name,
    role,
    teacher_id,
    teacherId,
    studentId,
    teacherData,
    studentData,
  } = body;
  const rawEmail = (email ?? "").trim();
  if (!rawEmail) {
    log("Missing email");
    return jsonResponse({ error: "Email é obrigatório" }, 400);
  }
  if (!isValidEmailFormat(rawEmail)) {
    log("Invalid email format", { email: rawEmail });
    return jsonResponse({ error: "Email inválido" }, 400);
  }
  const normalizedEmail = rawEmail.toLowerCase();

  if (!full_name || !role || !ROLES.includes(role)) {
    log("Missing required fields", {
      full_name,
      role,
      roleValid: ROLES.includes(role as Role),
    });
    return jsonResponse(
      { error: "Nome completo e tipo de conta são obrigatórios" },
      400
    );
  }

  if (callerRole === "teacher") {
    if (role !== "student") {
      log("Teacher tried to invite non-student", { role });
      return jsonResponse(
        { error: "Professores só podem convidar alunos" },
        403
      );
    }
    const effectiveTeacherId =
      teacher_id ??
      teacherId ??
      (studentData as Record<string, unknown> | undefined)?.teacher_id;
    if (!effectiveTeacherId || effectiveTeacherId !== callerTeacherId) {
      log("Teacher context mismatch", { effectiveTeacherId, callerTeacherId });
      return jsonResponse(
        { error: "Aluno deve ser vinculado ao seu perfil de professor" },
        403
      );
    }
  } else if (callerRole !== "admin") {
    log("Caller is not admin or teacher", { callerRole });
    return jsonResponse({ error: "Sem permissão para convidar usuários" }, 403);
  }

  let password = body.password;
  if (!password || password.length < 6) {
    password = randomPassword();
    log("Generated new password (no valid password in body)");
  } else {
    log("Using password from request body");
  }

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
    const err = await validatePhonePlatform(
      supabaseAdmin,
      studentData as Record<string, unknown> | undefined
    );
    if (err) return jsonResponse({ error: err }, 400);
  }
  if (role === "teacher" && !teacherId) {
    const err = await validatePhonePlatform(
      supabaseAdmin,
      teacherData as Record<string, unknown> | undefined
    );
    if (err) return jsonResponse({ error: err }, 400);
  }

  log("Inviting auth user", { email: normalizedEmail, role });

  const { data: inviteData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { full_name },
    });

  if (inviteError) {
    const msg = inviteError.message ?? "";
    const friendly =
      msg.toLowerCase().includes("already") ||
      msg.toLowerCase().includes("already been registered")
        ? "Email já cadastrado"
        : msg;
    log("Auth inviteUserByEmail failed", { error: inviteError.message });
    return jsonResponse({ error: friendly }, 400);
  }

  if (!inviteData.user) {
    log("Auth user null after invite");
    return jsonResponse({ error: "Falha ao criar usuário" }, 500);
  }

  const userId = inviteData.user.id;

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      password,
      email_confirm: true,
      user_metadata: { full_name, temporary_password: password },
    }
  );

  if (updateError) {
    log("Auth updateUser failed, rolling back", { error: updateError.message });
    await rollbackAuthUser(supabaseAdmin, userId);
    return jsonResponse({ error: updateError.message }, 500);
  }

  try {
    await waitForProfile(userId, supabaseAdmin);
  } catch (err) {
    log("Profile wait failed", { error: (err as Error).message });
    return jsonResponse(
      { error: (err as Error).message, userId, permissionsWarning: true },
      500
    );
  }

  let resolvedStudentId: string | null = studentId ?? null;
  let resolvedTeacherId: string | null = teacherId ?? null;

  if (role === "student") {
    if (!studentId) {
      const sd = (studentData ?? {}) as Record<string, unknown>;
      const tid = (teacher_id ?? teacherId ?? sd.teacher_id) as
        | string
        | undefined;
      const insertData = cleanInsertData({
        name: full_name,
        email: normalizedEmail,
        teacher_id: tid ?? null,
        ...sd,
      });
      const { data: student, error: studentErr } = await supabaseAdmin
        .from("students")
        .insert(insertData)
        .select("id")
        .single();

      if (studentErr) {
        log("Student insert failed, rolling back", {
          error: studentErr.message,
        });
        await rollbackAuthUser(supabaseAdmin, userId);
        return jsonResponse(
          { error: friendlyDuplicateError(studentErr.message) || studentErr.message },
          400
        );
      }
      resolvedStudentId = student?.id ?? null;
    }
  }

  if (role === "teacher") {
    if (!teacherId) {
      const td = (teacherData ?? {}) as Record<string, unknown>;
      const insertData = cleanInsertData({
        name: full_name,
        email: normalizedEmail,
        ...td,
      });
      const { data: teacher, error: teacherErr } = await supabaseAdmin
        .from("teachers")
        .insert(insertData)
        .select("id")
        .single();

      if (teacherErr) {
        log("Teacher insert failed, rolling back", {
          error: teacherErr.message,
        });
        await rollbackAuthUser(supabaseAdmin, userId);
        return jsonResponse(
          { error: friendlyDuplicateError(teacherErr.message) || teacherErr.message },
          400
        );
      }
      resolvedTeacherId = teacher?.id ?? null;
    }
  }

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update({
      role,
      full_name,
      email: normalizedEmail,
      teacher_id: role === "teacher" ? resolvedTeacherId : null,
      student_id: role === "student" ? resolvedStudentId : null,
    })
    .eq("user_id", userId);

  if (profileErr) {
    log("Profile update failed", { error: profileErr.message });
    return jsonResponse(
      { error: profileErr.message, userId, permissionsWarning: true },
      500
    );
  }

  log("User created successfully", { userId, role });

  return jsonResponse(
    {
      success: true,
      userId,
      email: normalizedEmail,
      temporaryPasswordGenerated: true,
      createdStudent:
        role === "student" && resolvedStudentId
          ? { id: resolvedStudentId }
          : null,
      createdTeacher:
        role === "teacher" && resolvedTeacherId
          ? { id: resolvedTeacherId }
          : null,
    },
    200
  );
});
