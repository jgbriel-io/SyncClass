// Edge Function: reset-password (unificada)
// Três fluxos em um único endpoint:
// A) Self-reset: qualquer usuário autenticado altera sua própria senha (currentPassword + newPassword)
// B) Admin: reseta qualquer usuário por userId (password)
// C) Admin/Professor: reseta aluno por studentId (password) — professor só do aluno vinculado

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
    userId?: string;          // Fluxo B — admin reseta por userId
    studentId?: string;       // Fluxo C — admin/professor reseta aluno
    password?: string;        // Fluxo B/C — nova senha
    currentPassword?: string; // Fluxo A — senha atual (self-reset)
    newPassword?: string;     // Fluxo A — nova senha (self-reset)
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

  // ✅ VULN-008 FIX: Rate limiting - 5 requests por minuto
  const { data: rateLimitOk, error: rateLimitError } = await supabaseAdmin
    .rpc("check_rate_limit", {
      p_operation: "reset_password",
      p_max_requests: 5,
      p_window_minutes: 1,
    });

  if (rateLimitError) {
    console.error("[reset-password] Rate limit check error:", rateLimitError);
  } else if (!rateLimitOk) {
    return jsonResponse({
      error: "Muitas tentativas de reset de senha. Aguarde 1 minuto e tente novamente.",
      retryAfter: 60,
    }, 429);
  }

  // ════════════════════════════════════════════════════════════
  // Fluxo A: Self-reset (currentPassword + newPassword)
  // ════════════════════════════════════════════════════════════
  if (body.currentPassword && body.newPassword) {
    const { currentPassword, newPassword } = body;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return jsonResponse({ error: "Dados inválidos." }, 400);
    }
    if (newPassword.length < 6) {
      return jsonResponse({ error: "A nova senha deve ter pelo menos 6 caracteres." }, 400);
    }

    // Verificar senha atual via sign-in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return jsonResponse({ error: "Senha atual incorreta." }, 403);
    }

    // Atualizar senha
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword },
    );

    if (updateError) {
      console.error("[reset-password] Self-reset error:", updateError);
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({ success: true }, 200);
  }

  // ════════════════════════════════════════════════════════════
  // Fluxos B/C: Admin ou Professor resetando outra pessoa
  // ════════════════════════════════════════════════════════════

  // 2) Verify caller role (admin ou teacher)
  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError) {
    console.error("[reset-password] Role error:", roleError);
    return jsonResponse({ error: "Erro ao verificar permissões." }, 500);
  }

  const callerRole = roleRow?.role;
  if (!callerRole || (callerRole !== "admin" && callerRole !== "teacher")) {
    return jsonResponse({ error: "Acesso negado. Apenas administradores ou professores podem redefinir senhas." }, 403);
  }

  // 3) Validate password
  const newPassword = body?.password;
  if (!newPassword || typeof newPassword !== "string") {
    return jsonResponse({ error: "Missing password" }, 400);
  }
  if (newPassword.length < 6) {
    return jsonResponse({ error: "A senha deve ter pelo menos 6 caracteres." }, 400);
  }

  // 4) Determine target user ID to update
  let targetUserId: string | null = null;

  const { userId, studentId } = body;

  if (studentId && typeof studentId === "string") {
    // ── Fluxo C: por studentId (professor ou admin) ──

    // ✅ VULN-007 FIX: usar supabaseAuthed (respeita RLS) ao invés de supabaseAdmin
    const { data: student, error: studentError } = await supabaseAuthed
      .from("students")
      .select("id, teacher_id")
      .eq("id", studentId)
      .maybeSingle();

    if (studentError || !student) {
      // RLS já garante: se não encontrou, professor não tem acesso
      return jsonResponse({ error: "Aluno não encontrado ou sem permissão." }, 404);
    }

    // ✅ Se chegou aqui, RLS já validou que o aluno pertence ao professor
    // Não precisa mais da validação manual de teacher_id

    const { data: studentProfile, error: studentProfileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("student_id", studentId)
      .maybeSingle();

    if (studentProfileError || !studentProfile?.user_id) {
      return jsonResponse({ error: "Este aluno não possui conta de acesso vinculada." }, 404);
    }

    targetUserId = studentProfile.user_id;

  } else if (userId && typeof userId === "string") {
    // ── Fluxo B: por userId direto (somente admin) ──

    if (callerRole !== "admin") {
      return jsonResponse({ error: "Acesso negado. Apenas administradores podem redefinir senha por userId." }, 403);
    }
    targetUserId = userId;

  } else {
    return jsonResponse({ error: "Informe studentId, userId, ou currentPassword + newPassword." }, 400);
  }

  // 5) Reset the password
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    targetUserId,
    { password: newPassword },
  );

  if (updateError) {
    console.error("[reset-password] Error resetting password:", updateError);
    return jsonResponse({ error: updateError.message }, 500);
  }



  return jsonResponse({ success: true }, 200);
});
