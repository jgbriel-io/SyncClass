import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import type { Activity, ActivityWithRelations } from "./useActivities";

// ---------------------------------------------------------------------------
// Display helpers (puras)
// ---------------------------------------------------------------------------

type ActivityForDisplay = Pick<Activity, "status" | "due_date" | "delivered_at">;

export function formatActivityDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return dueDate;
  const hasTime = dueDate.includes("T");
  return hasTime
    ? `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} às ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
    : `${dueDate.slice(8, 10)}/${dueDate.slice(5, 7)}/${dueDate.slice(0, 4)}`;
}

export function getActivityDisplayStatus(
  activity: ActivityForDisplay
): { label: string; variant: "success" | "warning" | "default" | "info" | "destructive" } {
  const dueTime = activity.due_date ? new Date(activity.due_date).getTime() : 0;
  const now = Date.now();
  const deliveredAt = activity.delivered_at;

  if (activity.status === "corrigida") return { label: "Corrigida", variant: "success" };
  if (activity.status === "entregue" && deliveredAt) {
    const onTime = new Date(deliveredAt).getTime() <= dueTime;
    return onTime ? { label: "Entregue", variant: "success" } : { label: "Entregue com atraso", variant: "warning" };
  }
  if (activity.status === "enviada") {
    if (dueTime > 0 && dueTime < now) return { label: "Vencida", variant: "destructive" };
    return { label: "Aguardando", variant: "warning" };
  }
  return { label: activity.status, variant: "default" };
}

// ---------------------------------------------------------------------------
// File upload / download
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = [
  "application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
const MAX_SIZE = 10 * 1024 * 1024;

function validateMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (mimeType === "image/jpeg") return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  if (mimeType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  if (mimeType === "image/webp") return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (mimeType === "application/msword") return bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return bytes[0] === 0x50 && bytes[1] === 0x4B;
  if (mimeType === "text/plain") return true;
  return false;
}

export async function uploadActivityFile(file: File): Promise<{ path: string; url: string }> {
  const rateLimitResult = checkRateLimit("uploadActivityFile", RATE_LIMIT_CONFIGS.UPLOAD);
  if (!rateLimitResult.allowed) throw new Error(`Muitos uploads. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`);

  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) throw new Error("Tipo não permitido. Use: PDF, JPEG, PNG, WebP, TXT, DOC ou DOCX");
  if (file.size > MAX_SIZE) throw new Error(`Arquivo muito grande. Máximo: ${MAX_SIZE / 1024 / 1024}MB`);

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!validateMagicBytes(bytes, file.type)) throw new Error("Arquivo corrompido ou tipo inválido. O conteúdo não corresponde à extensão.");

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_").substring(0, 100);
  const filePath = `${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage.from("activities").upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (uploadError) throw new Error("Erro ao fazer upload do arquivo: " + uploadError.message);

  return { path: filePath, url: filePath };
}

export async function getActivityFileUrl(filePathOrUrl: string): Promise<string> {
  let filePath = filePathOrUrl;
  if (filePathOrUrl.includes("supabase.co/storage/v1/object/public/activities/")) {
    filePath = filePathOrUrl.split("activities/").pop() || filePathOrUrl;
  } else if (filePathOrUrl.includes("supabase.co/storage/v1/object/sign/activities/")) {
    filePath = filePathOrUrl.split("activities/").pop()?.split("?")[0] || filePathOrUrl;
  }
  const { data, error } = await supabase.storage.from("activities").createSignedUrl(filePath, 3600);
  if (error) {
    if (error.message.includes("not found") || error.message.includes("Object not found")) throw new Error(`Arquivo não encontrado no storage: "${filePath}"`);
    throw new Error("Erro ao gerar URL do arquivo: " + error.message);
  }
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Query function
// ---------------------------------------------------------------------------

export async function fetchActivities(
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
