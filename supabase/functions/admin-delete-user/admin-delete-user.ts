// Edge Function: admin-delete-user
// Hard delete a Supabase auth user (and cascading public records) only for admins

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

  const authHeader = req.headers.get("Authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  const supabaseAuthed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: { user }, error: authError } = await supabaseAuthed.auth.getUser(jwt);

  if (authError || !user) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  // Check if caller is admin
  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError || !roleRow || roleRow.role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  // Parse body: só aba Usuários envia userId
  interface RequestBody {
    userId?: string;
  }
  let body: RequestBody;
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const userIdToDelete = body?.userId;
  if (!userIdToDelete) {
    return jsonResponse({ error: "Missing userId" }, 400);
  }

  // Usuário tem que estar inativo; pega student_id e teacher_id para apagar os registros das tabelas
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("active, student_id, teacher_id")
    .eq("user_id", userIdToDelete)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile for hard delete:", profileError);
    return jsonResponse({ error: "Falha ao carregar perfil." }, 500);
  }

  // Se o profile existe e está ativo, bloqueia — a menos que o student/teacher já tenha sido removido
  // (indica que o hard delete foi iniciado pela aba Alunos/Professores)
  if (profile && profile.active === true) {
    // Verifica se os registros vinculados ainda existem
    let studentStillExists = false;
    let teacherStillExists = false;

    if (profile.student_id) {
      const { data: s } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("id", profile.student_id)
        .maybeSingle();
      studentStillExists = !!s;
    }
    if (profile.teacher_id) {
      const { data: t } = await supabaseAdmin
        .from("teachers")
        .select("id")
        .eq("id", profile.teacher_id)
        .maybeSingle();
      teacherStillExists = !!t;
    }

    // Se o registro vinculado ainda existe, o usuário de fato não foi arquivado → bloqueia
    if (studentStillExists || teacherStillExists || (!profile.student_id && !profile.teacher_id)) {
      return jsonResponse({ error: "Arquive o usuário antes de excluir definitivamente." }, 400);
    }
  }

  const linkedStudentId = profile?.student_id ?? null;
  const linkedTeacherId = profile?.teacher_id ?? null;

  // 1) Remove linked record from students table (ignora se já foi removido)
  if (linkedStudentId) {
    const { error: studentDeleteError } = await supabaseAdmin
      .from("students")
      .delete()
      .eq("id", linkedStudentId);

    if (studentDeleteError) {
      // Ignora erro se o registro já não existir
      console.warn("Student record delete (may already be gone):", studentDeleteError.message);
    }
  }

  // 2) Remove linked record from teachers table
  if (linkedTeacherId) {
    const { error: teacherDeleteError } = await supabaseAdmin
      .from("teachers")
      .delete()
      .eq("id", linkedTeacherId);

    if (teacherDeleteError) {
      console.error("Error deleting teacher record:", teacherDeleteError);
      return jsonResponse(
        { error: "Falha ao remover registro do professor: " + (teacherDeleteError.message || "tente novamente.") },
        500,
      );
    }
  }

  // 3) Remove auth user if there was a linked profile (cascade removes profile and user_roles)
  if (userIdToDelete) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userIdToDelete,
    );

    if (deleteError) {
      // Se o usuário já não existe (404), considera sucesso
      const isUserNotFound = deleteError.status === 404 || 
                             deleteError.code === "user_not_found" ||
                             deleteError.message?.toLowerCase().includes("user not found");
      
      if (isUserNotFound) {
        console.log("User already deleted from Auth, cleaning up database records");
        // Usuário já foi deletado do Auth, mas pode ter registros no banco
        // Remove profile e user_roles manualmente se existirem
        await supabaseAdmin.from("profiles").delete().eq("user_id", userIdToDelete);
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userIdToDelete);
        return jsonResponse({ success: true }, 200);
      }
      
      console.error("Error hard-deleting user:", deleteError);
      return jsonResponse({ error: deleteError.message }, 500);
    }
    
    // Invalida todas as sessões do usuário deletado
    // Isso força o logout em todos os dispositivos
    try {
      await supabaseAdmin.auth.admin.signOut(userIdToDelete);
    } catch (signOutError) {
      // Ignora erro de signOut pois o usuário já foi deletado
      console.log("SignOut error (expected after delete):", signOutError);
    }
  }

  return jsonResponse({ success: true }, 200);
});
