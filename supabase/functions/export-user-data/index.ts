// Edge Function: export-user-data
// Exporta dados do usuário autenticado como JSON (LGPD art. 18 inc. V)
// Rate limit: 3 requisições por hora

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

  // Rate limit: 3 exportações por hora
  try {
    const { error: rateLimitError } = await supabaseAdmin.rpc("check_rate_limit", {
      p_operation: "export_user_data",
      p_max_requests: 3,
      p_window_minutes: 60,
    });
    if (rateLimitError) {
      return jsonResponse({
        error: "Limite de exportações atingido. Tente novamente em 1 hora.",
        retryAfter: 3600,
      }, 429);
    }
  } catch (_e) {
    return jsonResponse({ error: "Erro ao verificar rate limit" }, 500);
  }

  // Busca perfil
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Busca entidade vinculada (student ou teacher)
  let studentData = null;
  let teacherData = null;
  let classLogs: unknown[] = [];
  let financialRecords: unknown[] = [];
  let activities: unknown[] = [];

  if (profile?.student_id) {
    const { data } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("id", profile.student_id)
      .maybeSingle();
    studentData = data;

    const { data: logs } = await supabaseAdmin
      .from("class_logs")
      .select("id, class_date, attendance, notes, billed_amount, created_at")
      .eq("student_id", profile.student_id)
      .order("class_date", { ascending: false });
    classLogs = logs ?? [];

    const { data: financial } = await supabaseAdmin
      .from("financial_records")
      .select("id, amount, due_date, status, payment_method, paid_at, description, created_at")
      .eq("student_id", profile.student_id)
      .order("due_date", { ascending: false });
    financialRecords = financial ?? [];

    const { data: acts } = await supabaseAdmin
      .from("activities")
      .select("id, title, description, status, due_date, grade, created_at")
      .eq("student_id", profile.student_id)
      .order("created_at", { ascending: false });
    activities = acts ?? [];
  }

  if (profile?.teacher_id) {
    const { data } = await supabaseAdmin
      .from("teachers")
      .select("id, name, email, phone, status, created_at")
      .eq("id", profile.teacher_id)
      .maybeSingle();
    teacherData = data;

    const { data: logs } = await supabaseAdmin
      .from("class_logs")
      .select("id, class_date, attendance, notes, billed_amount, created_at")
      .eq("teacher_id", profile.teacher_id)
      .order("class_date", { ascending: false });
    classLogs = logs ?? [];
  }

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile: profile
      ? {
          full_name: profile.full_name,
          role: profile.role,
          active: profile.active,
          created_at: profile.created_at,
        }
      : null,
    student: studentData,
    teacher: teacherData,
    class_logs: classLogs,
    financial_records: financialRecords,
    activities,
  };

  const filename = `syncclass-export-${new Date().toISOString().split("T")[0]}.json`;

  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
