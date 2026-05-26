// Edge Function: cleanup-old-records
// Limpeza automática de registros antigos (audit_logs, idempotency_keys)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS_HEADERS, jsonResponse } from "../_shared/utils.ts";

interface CleanupStats {
  audit_logs_deleted: boolean;
  idempotency_keys_deleted: boolean;
  errors: string[];
}

function log(msg: string, data?: Record<string, unknown>) {
  console.log(`[cleanup-old-records] ${msg}`, data ?? "");
}

/**
 * TASK 1.3: Retry com Exponential Backoff
 * Tenta executar uma função até 3 vezes antes de falhar
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`${context} - Attempt ${attempt}/${maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      log(`${context} - Attempt ${attempt}/${maxRetries} failed`, { 
        error: lastError.message 
      });
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        log(`${context} - Waiting ${delay}ms before retry`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  log(`${context} - All ${maxRetries} attempts failed - CRITICAL`, {
    error: lastError?.message,
  });

  throw lastError;
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

  // Verificar autenticação (Cron Secret ou Service Role Key)
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  const cronSecret = req.headers.get("X-Cron-Secret");
  const expectedCronSecret = Deno.env.get("CRON_SECRET");

  const cronSecretValid = expectedCronSecret != null && cronSecret === expectedCronSecret;
  if (!cronSecretValid) {
    log("Unauthorized access attempt");
    return jsonResponse({ error: "Não autorizado" }, 401);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const stats: CleanupStats = {
    audit_logs_deleted: false,
    idempotency_keys_deleted: false,
    errors: [],
  };

  try {
    log("Starting cleanup process");

    // 1. Limpar audit_logs com retry
    try {
      await executeWithRetry(
        async () => {
          const { error } = await supabaseAdmin.rpc("cleanup_old_audit_logs");
          if (error) throw error;
        },
        3,
        "Cleanup audit_logs"
      );
      
      stats.audit_logs_deleted = true;
      log("Audit logs cleaned successfully");
    } catch (error) {
      const errorMsg = `Failed to cleanup audit_logs: ${(error as Error).message}`;
      log(errorMsg);
      stats.errors.push(errorMsg);
    }

    // 2. Limpar idempotency_keys com retry
    try {
      await executeWithRetry(
        async () => {
          const { error } = await supabaseAdmin.rpc("cleanup_old_idempotency_keys");
          if (error) throw error;
        },
        3,
        "Cleanup idempotency_keys"
      );
      
      stats.idempotency_keys_deleted = true;
      log("Idempotency keys cleaned successfully");
    } catch (error) {
      const errorMsg = `Failed to cleanup idempotency_keys: ${(error as Error).message}`;
      log(errorMsg);
      stats.errors.push(errorMsg);
    }

    // Verificar se houve alguma falha crítica
    if (stats.errors.length > 0) {
      log("Cleanup completed with errors", stats);
      return jsonResponse({
        success: false,
        message: "Limpeza concluída com erros",
        stats,
        timestamp: new Date().toISOString(),
      }, 207); // 207 Multi-Status
    }

    log("Cleanup completed successfully", stats);

    return jsonResponse({
      success: true,
      message: "Limpeza concluída com sucesso",
      stats,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (err) {
    log("Unexpected error during cleanup", { error: (err as Error).message });
    
    return jsonResponse({
      error: "Erro inesperado durante limpeza",
      detail: (err as Error).message,
      stats,
    }, 500);
  }
});
