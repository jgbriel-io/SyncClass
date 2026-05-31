import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS_HEADERS, jsonResponse } from "../_shared/utils.ts";

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

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError || !roleRow || roleRow.role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const { data: rateLimitOk, error: rateLimitError } = await supabaseAuthed
    .rpc("check_rate_limit", {
      p_operation: "admin_delete_user",
      p_max_requests: 20,
      p_window_minutes: 1,
    });

  if (rateLimitError) {
    console.error("[admin-delete-user] Rate limit check error:", rateLimitError);
  } else if (!rateLimitOk) {
    return jsonResponse({
      error: "Muitas operações de exclusão. Aguarde 1 minuto e tente novamente.",
      retryAfter: 60,
    }, 429);
  }

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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("active, student_id, teacher_id")
    .eq("user_id", userIdToDelete)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile for hard delete:", profileError);
    return jsonResponse({ error: "Falha ao carregar perfil." }, 500);
  }

  if (profile && profile.active === true) {
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

    if (studentStillExists || teacherStillExists || (!profile.student_id && !profile.teacher_id)) {
      return jsonResponse({ error: "Arquive o usuário antes de excluir definitivamente." }, 400);
    }
  }

  const linkedStudentId = profile?.student_id ?? null;
  const linkedTeacherId = profile?.teacher_id ?? null;

  if (linkedStudentId) {
    const { error: studentDeleteError } = await supabaseAdmin
      .from("students")
      .delete()
      .eq("id", linkedStudentId);

    if (studentDeleteError) {
      console.warn("Student record delete (may already be gone):", studentDeleteError.message);
    }
  }

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

  if (userIdToDelete) {
    try {
      const { error: invalidateError } = await supabaseAdmin.rpc(
        'invalidate_sessions_before_delete',
        { p_user_id: userIdToDelete }
      );
      
      if (invalidateError) {
        console.warn("Warning: Failed to invalidate sessions:", invalidateError);
      } else {
        console.log("Sessions invalidated for user:", userIdToDelete);
      }
    } catch (err) {
      console.warn("Warning: Exception invalidating sessions:", err);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userIdToDelete,
    );

    if (deleteError) {
      const isUserNotFound = deleteError.status === 404 || 
                             deleteError.code === "user_not_found" ||
                             deleteError.message?.toLowerCase().includes("user not found");
      
      if (isUserNotFound) {
        const { error: profileCleanupError } = await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("user_id", userIdToDelete);
        if (profileCleanupError) {
          console.error("Profile cleanup failed:", profileCleanupError.message);
          return jsonResponse({ error: "Profile cleanup failed" }, 500);
        }
        return jsonResponse({ success: true }, 200);
      }
      
      console.error("Error hard-deleting user:", deleteError);
      return jsonResponse({ error: deleteError.message }, 500);
    }
    
    try {
      await supabaseAdmin.auth.admin.signOut(userIdToDelete);
    } catch (signOutError) {
      console.log("SignOut error (expected after delete):", signOutError);
    }
  }

  return jsonResponse({ success: true }, 200);
});
