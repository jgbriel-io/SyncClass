// Edge Function: teacher-reset-password
// Permite que um professor redefina a senha de um aluno vinculado a ele

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    return jsonResponse({ error: "Missing Supabase env vars" }, 500);
  }

  interface RequestBody {
    studentId?: string;
    password?: string;
    accessToken?: string;
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const authHeader = req.headers.get("Authorization");
  const jwtFromAuth = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const jwtFromBody = typeof body?.accessToken === "string" ? body.accessToken.trim() : "";
  const jwt = jwtFromAuth || jwtFromBody;

  if (!jwt) {
    return jsonResponse({ error: "Token de autenticação ausente. Faça login novamente." }, 401);
  }

  const bearer = authHeader ?? `Bearer ${jwt}`;
  const supabaseAuthed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: bearer } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // 1) Authenticate caller
  const { data: { user }, error: authError } = await supabaseAuthed.auth.getUser(jwt);

  if (authError) {
    return jsonResponse({ error: `Erro de autenticação: ${authError.message}` }, 401);
  }
  if (!user) {
    return jsonResponse({ error: "Usuário não encontrado. Token inválido." }, 401);
  }

  // 2) Verify caller is a teacher (or admin — admins can also use this endpoint)
  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError) {
    console.error("[teacher-reset-password] Role error:", roleError);
    return jsonResponse({ error: "Erro ao verificar permissões." }, 500);
  }
  if (!roleRow || (roleRow.role !== "teacher" && roleRow.role !== "admin")) {
    return jsonResponse({ error: "Acesso negado. Apenas professores ou administradores podem usar esta função." }, 403);
  }

  // 3) Validate input
  const studentId = body?.studentId;
  const newPassword = body?.password;

  if (!studentId || typeof studentId !== "string") {
    return jsonResponse({ error: "Missing studentId" }, 400);
  }
  if (!newPassword || typeof newPassword !== "string") {
    return jsonResponse({ error: "Missing password" }, 400);
  }
  if (newPassword.length < 6) {
    return jsonResponse({ error: "A senha deve ter pelo menos 6 caracteres." }, 400);
  }

  // 4) Verify student exists and get the linked user_id
  const { data: student, error: studentError } = await supabaseAdmin
    .from("students")
    .select("id, teacher_id")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError || !student) {
    return jsonResponse({ error: "Aluno não encontrado." }, 404);
  }

  // 5) If caller is a teacher, verify the student belongs to them
  if (roleRow.role === "teacher") {
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from("profiles")
      .select("teacher_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (callerProfileError || !callerProfile?.teacher_id) {
      return jsonResponse({ error: "Perfil de professor não encontrado." }, 403);
    }

    if (student.teacher_id !== callerProfile.teacher_id) {
      return jsonResponse({ error: "Acesso negado. Este aluno não está vinculado a você." }, 403);
    }
  }

  // 6) Find the auth user linked to this student via profiles
  const { data: studentProfile, error: studentProfileError } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("student_id", studentId)
    .maybeSingle();

  if (studentProfileError || !studentProfile?.user_id) {
    return jsonResponse({ error: "Este aluno não possui conta de acesso vinculada." }, 404);
  }

  const studentUserId = studentProfile.user_id;

  // 7) Reset the password
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    studentUserId,
    { password: newPassword },
  );

  if (updateError) {
    console.error("[teacher-reset-password] Error resetting password:", updateError);
    return jsonResponse({ error: updateError.message }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
