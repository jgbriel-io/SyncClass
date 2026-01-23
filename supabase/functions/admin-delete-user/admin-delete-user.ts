// Edge Function: admin-delete-user
// Hard delete a Supabase auth user (and cascading public records) only for admins

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Client bound to the caller's JWT, used only to identify who is calling
  const supabaseAuthed = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  // Admin client with service role, used for privileged operations
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Identify caller
  const {
    data: { user },
    error: authError,
  } = await supabaseAuthed.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if caller is admin
  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError || !roleRow || roleRow.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse body
  let body: any;
  try {
    body = await req.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userIdToDelete = body?.userId as string | undefined;
  if (!userIdToDelete) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ensure the target user is already deactivated at profile level
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("active, student_id")
    .eq("user_id", userIdToDelete)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile for hard delete:", profileError);
    return new Response(JSON.stringify({ error: "Failed to load profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (profile && profile.active === true) {
    return new Response(
      JSON.stringify({ error: "User must be deactivated before hard delete" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Perform hard delete via Admin API
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    userIdToDelete,
  );

  if (deleteError) {
    console.error("Error hard-deleting user:", deleteError);
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
