import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/utils/errorMessages";
import { logger } from "@/lib/sentry";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";

export type Activity = Tables<"activities">;
export type ActivityInsert = TablesInsert<"activities">;
export type ActivityUpdate = TablesUpdate<"activities">;

export interface ActivityWithRelations extends Activity {
  students: {
    name: string;
  } | null;
  teachers: {
    name: string;
  } | null;
}

/** Atividade com pelo menos status, due_date e delivered_at (para exibição de status) */
type ActivityForDisplay = Pick<Activity, "status" | "due_date" | "delivered_at">;

/** Formata due_date (ISO ou YYYY-MM-DD) para exibição: "dd/MM/yyyy às HH:mm" ou só data se legado */
export function formatActivityDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return dueDate;
  const hasTime = dueDate.includes("T");
  return hasTime
    ? `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} às ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
    : `${dueDate.slice(8, 10)}/${dueDate.slice(5, 7)}/${dueDate.slice(0, 4)}`;
}

/** Retorna label e variant do badge considerando prazo (data+hora) e entrega (no prazo / atraso / vencida). */
export function getActivityDisplayStatus(
  activity: ActivityForDisplay
): { label: string; variant: "success" | "warning" | "default" | "info" | "destructive" } {
  const dueTime = activity.due_date ? new Date(activity.due_date).getTime() : 0;
  const now = Date.now();
  const deliveredAt = activity.delivered_at;

  if (activity.status === "corrigida") {
    return { label: "Corrigida", variant: "success" };
  }
  if (activity.status === "entregue" && deliveredAt) {
    const deliveredTime = new Date(deliveredAt).getTime();
    const onTime = deliveredTime <= dueTime;
    return onTime
      ? { label: "Entregue", variant: "success" }
      : { label: "Entregue com atraso", variant: "warning" };
  }
  if (activity.status === "enviada") {
    if (dueTime > 0 && dueTime < now) {
      return { label: "Vencida", variant: "destructive" };
    }
    return { label: "Aguardando", variant: "warning" };
  }
  return { label: activity.status, variant: "default" };
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Valida magic bytes (assinatura do arquivo) para garantir que o tipo é real
 */
function validateMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (mimeType === 'application/pdf') {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }
  
  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }
  
  // PNG: 89 50 4E 47
  if (mimeType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  }
  
  // WebP: RIFF ... WEBP
  if (mimeType === 'image/webp') {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
           bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  
  // DOC: D0 CF 11 E0 (Microsoft Office)
  if (mimeType === 'application/msword') {
    return bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
  }
  
  // DOCX: PK (ZIP format - 50 4B)
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return bytes[0] === 0x50 && bytes[1] === 0x4B;
  }
  
  // Text: permite qualquer coisa (não tem magic bytes específico)
  if (mimeType === 'text/plain') {
    return true;
  }
  
  return false;
}

/** Upload de arquivo para o Supabase Storage */
export async function uploadActivityFile(file: File): Promise<{ path: string; url: string }> {
  // Rate limiting: 5 uploads por 5 minutos
  const rateLimitResult = checkRateLimit("uploadActivityFile", RATE_LIMIT_CONFIGS.UPLOAD);
  if (!rateLimitResult.allowed) {
    throw new Error(
      `Muitos uploads. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
    );
  }

  // Validar tipo MIME
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    throw new Error(`Tipo não permitido. Use: PDF, JPEG, PNG, WebP, TXT, DOC ou DOCX`);
  }
  
  // Validar tamanho
  if (file.size > MAX_SIZE) {
    throw new Error(`Arquivo muito grande. Máximo: ${MAX_SIZE / 1024 / 1024}MB`);
  }
  
  // Validar magic bytes (primeiros 12 bytes do arquivo)
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  if (!validateMagicBytes(bytes, file.type)) {
    throw new Error("Arquivo corrompido ou tipo inválido. O conteúdo não corresponde à extensão.");
  }
  
  // Gerar nome seguro usando o nome original sanitizado
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove caracteres especiais
    .replace(/_{2,}/g, '_') // Remove underscores duplicados
    .substring(0, 100); // Limita tamanho
  
  const timestamp = Date.now();
  const fileName = `${timestamp}-${sanitizedName}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from("activities")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error("Erro ao fazer upload do arquivo: " + uploadError.message);
  }

  // Para buckets privados, armazenamos apenas o path
  // A URL será gerada quando necessário via signed URL
  return {
    path: filePath,
    url: filePath, // Armazenamos o path, não a URL
  };
}

/** Download/visualização de arquivo - gera signed URL temporária (válida por 1 hora) */
export async function getActivityFileUrl(filePathOrUrl: string): Promise<string> {
  // Extrair apenas o nome do arquivo se for uma URL completa
  let filePath = filePathOrUrl;
  
  // Se for uma URL do Supabase, extrair apenas o path
  if (filePathOrUrl.includes('supabase.co/storage/v1/object/public/activities/')) {
    filePath = filePathOrUrl.split('activities/').pop() || filePathOrUrl;
  } else if (filePathOrUrl.includes('supabase.co/storage/v1/object/sign/activities/')) {
    filePath = filePathOrUrl.split('activities/').pop()?.split('?')[0] || filePathOrUrl;
  }

  // Tentar criar signed URL
  const { data, error } = await supabase.storage
    .from("activities")
    .createSignedUrl(filePath, 3600); // 1 hora

  if (error) {
    // Se o arquivo não existe, verificar se há problema com o path
    if (error.message.includes("not found") || error.message.includes("Object not found")) {
      throw new Error(`Arquivo não encontrado no storage. Verifique se o arquivo "${filePath}" existe no bucket 'activities'.`);
    }
    
    throw new Error("Erro ao gerar URL do arquivo: " + error.message);
  }

  return data.signedUrl;
}

/** Arquivo já usado em alguma atividade (para reutilizar no envio) */
export interface ActivityFileOption {
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
}

/** Lista de arquivos distintos já enviados pelo professor (para seleção "arquivo da plataforma") */
export function useActivityFilesForTeacher(teacherId: string | undefined) {
  const { data: activities = [], ...rest } = useActivities(teacherId, undefined);
  const files = useMemo(() => {
    const seen = new Set<string>();
    const list: ActivityFileOption[] = [];
    for (const a of activities) {
      if (a.file_url && !seen.has(a.file_url)) {
        seen.add(a.file_url);
        list.push({
          file_url: a.file_url,
          file_name: a.file_name,
          file_type: a.file_type ?? null,
          file_size: a.file_size ?? null,
        });
      }
    }
    return list;
  }, [activities]);
  return { data: files, ...rest };
}

/** Lista de arquivos distintos de TODOS os professores (para admin) */
export function useAllActivityFiles() {
  const { data: activities = [], ...rest } = useActivities(undefined, undefined, { fetchAll: true });
  const files = useMemo(() => {
    const seen = new Set<string>();
    const list: ActivityFileOption[] = [];
    for (const a of activities) {
      // Apenas arquivos principais (file_url), nunca arquivos de resposta de alunos
      if (a.file_url && !seen.has(a.file_url)) {
        seen.add(a.file_url);
        list.push({
          file_url: a.file_url,
          file_name: a.file_name,
          file_type: a.file_type ?? null,
          file_size: a.file_size ?? null,
        });
      }
    }
    return list;
  }, [activities]);
  return { data: files, ...rest };
}

/** Opções para listagem: fetchAll = true (admin) busca todas as atividades da plataforma */
export type UseActivitiesOptions = { fetchAll?: boolean };

/** Listar atividades (professor, aluno ou admin) */
export function useActivities(
  teacherId?: string,
  studentId?: string,
  options?: UseActivitiesOptions
) {
  const fetchAll = options?.fetchAll === true;

  return useQuery({
    queryKey: ["activities", teacherId, studentId, fetchAll],
    queryFn: async () => {
      let query = supabase
        .from("activities")
        .select(`
          *,
          students (name),
          teachers (name)
        `)
        .is("deleted_at", null) // Filtrar atividades não deletadas
        .order("created_at", { ascending: false });

      if (!fetchAll) {
        if (teacherId) query = query.eq("teacher_id", teacherId);
        if (studentId) query = query.eq("student_id", studentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as ActivityWithRelations[];
    },
    // Habilita se: fetchAll OU tem teacherId OU tem studentId
    enabled: fetchAll || !!teacherId || !!studentId,
  });
}

/** Criar atividade (professor) */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: ActivityInsert) => {
      // Rate limiting: 10 chamadas por minuto
      const rateLimitResult = checkRateLimit("createActivity", RATE_LIMIT_CONFIGS.NORMAL);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Muitas requisições. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
        );
      }

      const { data, error } = await supabase
        .from("activities")
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade enviada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useCreateActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

/** Atualizar atividade (feedback/correção) */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ActivityUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("activities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade atualizada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

/** Marcar atividade como entregue (aluno) */
export function useMarkActivityAsDelivered() {
  return useOptimisticMutation<Activity, {
    activityId: string;
    responseText?: string;
    responseFileUrl?: string;
    responseFileName?: string;
  }>({
    mutationFn: async ({
      activityId,
      responseText,
      responseFileUrl,
      responseFileName,
    }) => {
      const { data, error } = await supabase
        .from("activities")
        .update({
          status: "entregue",
          delivered_at: new Date().toISOString(),
          student_response_text: responseText || null,
          response_file_url: responseFileUrl || null,
          response_file_name: responseFileName || null,
        })
        .eq("id", activityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    queryKey: ["activities"],
    optimisticUpdate: (oldData: ActivityWithRelations[], { activityId }) => {
      return oldData.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              status: "entregue" as const,
              delivered_at: new Date().toISOString(),
            }
          : activity
      );
    },
    successMessage: "Atividade marcada como entregue!",
    errorMessage: "Erro ao marcar atividade como entregue",
    onError: (error) => {
      logger.error(error, { context: "useMarkActivityAsDelivered" });
    },
  });
}

/** Adicionar correção/feedback (professor) */
export function useAddActivityCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      feedback,
      grade,
      correctionFileUrl,
      correctionFileName,
    }: {
      activityId: string;
      feedback?: string;
      grade?: number | null;
      correctionFileUrl?: string;
      correctionFileName?: string;
    }) => {
      const { data, error } = await supabase
        .from("activities")
        .update({
          status: "corrigida",
          feedback: feedback || null,
          grade: grade != null ? grade : null,
          correction_file_url: correctionFileUrl || null,
          correction_file_name: correctionFileName || null,
          corrected_at: new Date().toISOString(),
        })
        .eq("id", activityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Correção enviada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useAddActivityCorrection" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

/** Deletar atividade (professor) */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      // Soft delete: marcar como deletado em vez de remover do banco
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("activities")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id || null,
        })
        .eq("id", activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade excluída com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useDeleteActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
