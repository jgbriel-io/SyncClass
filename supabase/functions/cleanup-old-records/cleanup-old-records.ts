// Edge Function: cleanup-old-records
// Limpeza automática de registros antigos (audit_logs, idempotency_keys)
// Deve ser agendada via Supabase Cron ou chamada manualmente

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function log(msg: string, data?: Record<string, unknown>) {
  console.log(`[cleanup-old-records] ${msg}`, data ?? "");
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
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    log("Missing Supabase env vars");
    return jsonResponse({ error: "Configuração do servidor incompleta" }, 500);
  }

  // Verificar se a requisição vem do Supabase Cron ou de um admin
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  const cronSecret = req.headers.get("X-Cron-Secret");
  const expectedCronSecret = Deno.env.get("CRON_SECRET");

  // Permitir acesso via Cron Secret ou Service Role Key
  if (cronSecret !== expectedCronSecret && !authHeader?.includes(serviceRoleKey)) {
    log("Unauthorized access attempt");
    return jsonResponse({ error: "Não autorizado" }, 401);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    log("Starting cleanup process");

    // 1. Limpar audit_logs com mais de 90 dias
    const { error: auditError } = await supabaseAdmin.rpc("cleanup_old_audit_logs");

    if (auditError) {
      log("Failed to cleanup audit_logs", { error: auditError.message });
      return jsonResponse({
        error: "Falha ao limpar audit_logs",
        detail: auditError.message,
      }, 500);
    }

    // 2. Limpar idempotency_keys completadas há mais de 7 dias
    const { error: idempotencyError } = await supabaseAdmin.rpc("cleanup_old_idempotency_keys");

    if (idempotencyError) {
      log("Failed to cleanup idempotency_keys", { error: idempotencyError.message });
      return jsonResponse({
        error: "Falha ao limpar idempotency_keys",
        detail: idempotencyError.message,
      }, 500);
    }

    log("Cleanup completed successfully");

    return jsonResponse({
      success: true,
      message: "Limpeza concluída com sucesso",
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (err) {
    log("Unexpected error during cleanup", { error: (err as Error).message });
    return jsonResponse({
      error: "Erro inesperado durante limpeza",
      detail: (err as Error).message,
    }, 500);
  }
});
