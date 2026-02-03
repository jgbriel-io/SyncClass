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

  // Parse body
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

  // Ensure the target user is already deactivated at profile level
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("active, student_id")
    .eq("user_id", userIdToDelete)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile for hard delete:", profileError);
    return jsonResponse({ error: "Failed to load profile" }, 500);
  }

  if (profile && profile.active === true) {
    return jsonResponse({ error: "User must be deactivated before hard delete" }, 400);
  }

  // Perform hard delete via Admin API
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    userIdToDelete,
  );

  if (deleteError) {
    console.error("Error hard-deleting user:", deleteError);
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
