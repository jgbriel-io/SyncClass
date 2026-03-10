// Edge Function: cleanup-old-records
// Limpeza automática de registros antigos (audit_logs, idempotency_keys)
// Sprint 1 - Task 1.3: Adicionado retry e integração com Sentry
// Sprint 4 - Task 4.3: Integração com Sentry para alertas

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Sentry SDK para Deno (opcional - apenas se SENTRY_DSN estiver configurado)
// import * as Sentry from "https://deno.land/x/sentry/index.mjs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Configuração do Sentry (opcional)
const SENTRY_DSN = Deno.env.get("SENTRY_DSN");
const SENTRY_ENABLED = !!SENTRY_DSN;

// Inicializar Sentry se configurado
// if (SENTRY_ENABLED) {
//   Sentry.init({
//     dsn: SENTRY_DSN,
//     environment: Deno.env.get("ENVIRONMENT") || "production",
//     tracesSampleRate: 1.0,
//   });
// }

/**
 * Envia erro para Sentry (se configurado)
 */
function captureException(error: Error, context: Record<string, unknown> = {}) {
  if (!SENTRY_ENABLED) {
    log("Sentry not configured, skipping error capture");
    return;
  }
  
  // TODO: Descomentar quando Sentry SDK estiver instalado
  // Sentry.captureException(error, {
  //   tags: {
  //     function: "cleanup-old-records",
  //     ...context,
  //   },
  //   level: "error",
  // });
  
  log("Error captured (Sentry disabled)", { error: error.message, context });
}

interface CleanupStats {
  audit_logs_deleted: boolean;
  idempotency_keys_deleted: boolean;
  errors: string[];
}

function log(msg: string, data?: Record<string, unknown>) {
  console.log(`[cleanup-old-records] ${msg}`, data ?? "");
}

function jsonResponse(data: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
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
  
  // Todas as tentativas falharam - enviar alerta crítico
  log(`${context} - All ${maxRetries} attempts failed - CRITICAL`, {
    error: lastError?.message,
  });
  
  // Capturar erro no Sentry
  captureException(lastError!, {
    operation: context,
    critical: true,
    maxRetries,
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

  if (cronSecret !== expectedCronSecret && !authHeader?.includes(serviceRoleKey)) {
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
