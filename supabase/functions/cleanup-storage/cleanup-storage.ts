// Edge Function: cleanup-storage
// Limpeza automática de arquivos órfãos no Storage
// Sprint 1 - Task 1.2 e 1.3
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
  //     function: "cleanup-storage",
  //     ...context,
  //   },
  //   level: "error",
  // });
  
  log("Error captured (Sentry disabled)", { error: error.message, context });
}

interface OrphanedFile {
  activity_id: string;
  file_url: string | null;
  response_file_url: string | null;
  correction_file_url: string | null;
  deleted_at: string;
  days_since_deletion: number;
}

interface CleanupStats {
  activities_scanned: number;
  files_deleted: number;
  files_failed: number;
  activities_hard_deleted: number;
  errors: string[];
}

function log(msg: string, data?: Record<string, unknown>) {
  console.log(`[cleanup-storage] ${msg}`, data ?? "");
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
  
  // Todas as tentativas falharam
  log(`${context} - All ${maxRetries} attempts failed`, {
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

/**
 * Deleta um arquivo do Storage com retry
 */
async function deleteStorageFile(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  filePath: string
): Promise<boolean> {
  try {
    await executeWithRetry(
      async () => {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath]);
        
        if (error) throw error;
      },
      3,
      `Delete file: ${filePath}`
    );
    
    log(`File deleted successfully`, { bucket, filePath });
    return true;
  } catch (error) {
    log(`Failed to delete file after retries`, { 
      bucket, 
      filePath, 
      error: (error as Error).message 
    });
    return false;
  }
}

/**
 * Processa limpeza de arquivos de uma atividade
 */
async function cleanupActivityFiles(
  supabase: ReturnType<typeof createClient>,
  activity: OrphanedFile,
  stats: CleanupStats
): Promise<void> {
  const filesToDelete: string[] = [];
  
  if (activity.file_url) filesToDelete.push(activity.file_url);
  if (activity.response_file_url) filesToDelete.push(activity.response_file_url);
  if (activity.correction_file_url) filesToDelete.push(activity.correction_file_url);
  
  log(`Processing activity ${activity.activity_id}`, {
    files: filesToDelete.length,
    days_since_deletion: activity.days_since_deletion,
  });
  
  let allFilesDeleted = true;
  
  for (const filePath of filesToDelete) {
    const success = await deleteStorageFile(supabase, "activities", filePath);
    
    if (success) {
      stats.files_deleted++;
    } else {
      stats.files_failed++;
      allFilesDeleted = false;
      stats.errors.push(`Failed to delete: ${filePath}`);
    }
  }
  
  // Se todos os arquivos foram deletados, marcar como limpo no banco
  if (allFilesDeleted && filesToDelete.length > 0) {
    try {
      await executeWithRetry(
        async () => {
          const { error } = await supabase.rpc("mark_activity_files_cleaned", {
            p_activity_id: activity.activity_id,
          });
          
          if (error) throw error;
        },
        3,
        `Mark activity ${activity.activity_id} as cleaned`
      );
      
      log(`Activity marked as cleaned`, { activity_id: activity.activity_id });
    } catch (error) {
      log(`Failed to mark activity as cleaned`, {
        activity_id: activity.activity_id,
        error: (error as Error).message,
      });
      stats.errors.push(`Failed to mark activity ${activity.activity_id} as cleaned`);
    }
  }
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
    activities_scanned: 0,
    files_deleted: 0,
    files_failed: 0,
    activities_hard_deleted: 0,
    errors: [],
  };

  try {
    log("Starting storage cleanup process");

    // 1. Buscar arquivos órfãos (atividades deletadas há mais de 90 dias)
    const { data: orphanedFiles, error: fetchError } = await executeWithRetry(
      async () => {
        const result = await supabaseAdmin.rpc("get_orphaned_activity_files");
        if (result.error) throw result.error;
        return result;
      },
      3,
      "Fetch orphaned files"
    );

    if (fetchError) {
      log("Failed to fetch orphaned files", { error: fetchError.message });
      return jsonResponse({
        error: "Falha ao buscar arquivos órfãos",
        detail: fetchError.message,
      }, 500);
    }

    const activities = (orphanedFiles || []) as OrphanedFile[];
    stats.activities_scanned = activities.length;

    log(`Found ${activities.length} activities with orphaned files`);

    // 2. Processar cada atividade
    for (const activity of activities) {
      await cleanupActivityFiles(supabaseAdmin, activity, stats);
    }

    // 3. Hard delete de atividades antigas (sem arquivos)
    try {
      const { data: deletedCount, error: hardDeleteError } = await executeWithRetry(
        async () => {
          const result = await supabaseAdmin.rpc("hard_delete_old_activities");
          if (result.error) throw result.error;
          return result;
        },
        3,
        "Hard delete old activities"
      );

      if (hardDeleteError) {
        log("Failed to hard delete old activities", { error: hardDeleteError.message });
        stats.errors.push(`Hard delete failed: ${hardDeleteError.message}`);
      } else {
        stats.activities_hard_deleted = deletedCount || 0;
        log(`Hard deleted ${stats.activities_hard_deleted} old activities`);
      }
    } catch (error) {
      log("Hard delete failed after retries", { error: (error as Error).message });
      stats.errors.push(`Hard delete failed: ${(error as Error).message}`);
    }

    log("Storage cleanup completed", stats);

    return jsonResponse({
      success: true,
      message: "Limpeza de storage concluída",
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
