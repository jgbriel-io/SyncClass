import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeErrorMessage, logError } from "@/lib/security/errorHandler";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { activities as activitiesContent } from "@/content";
import { QK } from "./queryKeys";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export type UseActivitiesOptions = { fetchAll?: boolean };

export interface ActivityFileOption {
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
}

// ---------------------------------------------------------------------------
// Display helpers (puras)
// ---------------------------------------------------------------------------

type ActivityForDisplay = Pick<
  Activity,
  "status" | "due_date" | "delivered_at"
>;

export function formatActivityDueDate(
  dueDate: string | null | undefined
): string {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return dueDate;
  const hasTime = dueDate.includes("T");
  return hasTime
    ? `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} às ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
    : `${dueDate.slice(8, 10)}/${dueDate.slice(5, 7)}/${dueDate.slice(0, 4)}`;
}

export function getActivityDisplayStatus(activity: ActivityForDisplay): {
  label: string;
  variant: "success" | "warning" | "default" | "info" | "destructive";
} {
  const dueTime = activity.due_date ? new Date(activity.due_date).getTime() : 0;
  const now = Date.now();
  const deliveredAt = activity.delivered_at;

  if (activity.status === "corrigida")
    return { label: "Corrigida", variant: "success" };
  if (activity.status === "entregue" && deliveredAt) {
    const onTime = new Date(deliveredAt).getTime() <= dueTime;
    return onTime
      ? { label: "Entregue", variant: "success" }
      : { label: "Entregue com atraso", variant: "warning" };
  }
  if (activity.status === "enviada") {
    if (dueTime > 0 && dueTime < now)
      return { label: "Vencida", variant: "destructive" };
    return { label: "Aguardando", variant: "warning" };
  }
  if (activity.status === "pendente") {
    if (dueTime > 0 && dueTime < now)
      return { label: "Atrasada", variant: "destructive" };
    return { label: "Pendente", variant: "default" };
  }
  const label = activity.status
    ? activity.status.charAt(0).toUpperCase() + activity.status.slice(1)
    : "—";
  return { label, variant: "default" };
}

// ---------------------------------------------------------------------------
// File upload / download
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
const MAX_SIZE = 10 * 1024 * 1024;

function validateMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "application/pdf")
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    );
  if (mimeType === "image/jpeg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png")
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  if (mimeType === "image/webp") {
    if (bytes.length < 12) return false;
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  if (mimeType === "application/msword")
    return (
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0
    );
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (mimeType === "text/plain") return true;
  return false;
}

export async function uploadActivityFile(
  file: File
): Promise<{ path: string; url: string }> {
  const rateLimitResult = checkRateLimit(
    "uploadActivityFile",
    RATE_LIMIT_CONFIGS.UPLOAD
  );
  if (!rateLimitResult.allowed)
    throw new Error(
      `Muitos uploads. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
    );

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number]))
    throw new Error(
      "Tipo não permitido. Use: PDF, JPEG, PNG, WebP, TXT, DOC ou DOCX"
    );
  if (file.size > MAX_SIZE)
    throw new Error(
      `Arquivo muito grande. Máximo: ${MAX_SIZE / 1024 / 1024}MB`
    );

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!validateMagicBytes(bytes, file.type))
    throw new Error(
      "Arquivo corrompido ou tipo inválido. O conteúdo não corresponde à extensão."
    );

  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 100);
  const filePath = `${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from("activities")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
  if (uploadError)
    throw new Error("Erro ao fazer upload do arquivo: " + uploadError.message);

  return { path: filePath, url: filePath };
}

export async function getActivityFileUrl(
  filePathOrUrl: string
): Promise<string> {
  let filePath = filePathOrUrl;
  if (
    filePathOrUrl.includes("supabase.co/storage/v1/object/public/activities/")
  ) {
    filePath = filePathOrUrl.split("activities/").pop() || filePathOrUrl;
  } else if (
    filePathOrUrl.includes("supabase.co/storage/v1/object/sign/activities/")
  ) {
    filePath =
      filePathOrUrl.split("activities/").pop()?.split("?")[0] || filePathOrUrl;
  }
  const { data, error } = await supabase.storage
    .from("activities")
    .createSignedUrl(filePath, 3600);
  if (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("Object not found")
    )
      throw new Error(`Arquivo não encontrado no storage: "${filePath}"`);
    throw new Error("Erro ao gerar URL do arquivo: " + error.message);
  }
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Query function
// ---------------------------------------------------------------------------

async function fetchActivities(
  teacherId: string | undefined,
  studentId: string | undefined,
  fetchAll: boolean
): Promise<ActivityWithRelations[]> {
  let query = supabase
    .from("activities")
    .select("*, students (name), teachers (name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!fetchAll) {
    if (teacherId) query = query.eq("teacher_id", teacherId);
    if (studentId) query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityWithRelations[];
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useActivityFilesForTeacher(teacherId: string | undefined) {
  const { data: activities = [], ...rest } = useActivities(
    teacherId,
    undefined
  );
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

export function useAllActivityFiles() {
  const { data: activities = [], ...rest } = useActivities(
    undefined,
    undefined,
    { fetchAll: true }
  );
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

export function useActivities(
  teacherId?: string,
  studentId?: string,
  options?: UseActivitiesOptions
) {
  const fetchAll = options?.fetchAll === true;
  return useQuery({
    queryKey: [QK.ACTIVITIES, teacherId, studentId, fetchAll],
    queryFn: () => fetchActivities(teacherId, studentId, fetchAll),
    enabled: fetchAll || !!teacherId || !!studentId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: ActivityInsert) => {
      const rateLimitResult = checkRateLimit(
        "createActivity",
        RATE_LIMIT_CONFIGS.NORMAL
      );
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
      queryClient.invalidateQueries({
        queryKey: [QK.ACTIVITIES],
        exact: false,
      });
      toast.success(activitiesContent.sendDialog.toasts.success);
    },
    onError: (error) => {
      logger.error(error, { context: "useCreateActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

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
      queryClient.invalidateQueries({
        queryKey: [QK.ACTIVITIES],
        exact: false,
      });
      toast.success(activitiesContent.editDialog.toasts.success);
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useMarkActivityAsDelivered() {
  return useOptimisticMutation<
    Activity,
    {
      activityId: string;
      responseText?: string;
      responseFileUrl?: string;
      responseFileName?: string;
    }
  >({
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
    queryKey: [QK.ACTIVITIES],
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
      queryClient.invalidateQueries({ queryKey: [QK.ACTIVITIES] });
      toast.success(activitiesContent.correctionDialog.toasts.success);
    },
    onError: (error) => {
      logger.error(error, { context: "useAddActivityCorrection" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
      queryClient.invalidateQueries({ queryKey: [QK.ACTIVITIES] });
      toast.success(activitiesContent.deleteDialog.toasts.success);
    },
    onError: (error) => {
      logger.error(error, { context: "useDeleteActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
