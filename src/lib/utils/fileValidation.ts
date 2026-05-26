/**
 * Utilitários para validação de arquivos e rate limiting de uploads
 */

import { supabase } from "@/integrations/supabase/client";

// Tipos de arquivo permitidos por contexto
export const FILE_TYPES = {
  PROFILE_PHOTO: {
    accept: ".png,.jpg,.jpeg",
    mimeTypes: ["image/png", "image/jpeg", "image/jpg"],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: "PNG ou JPEG até 5MB",
  },
  ACTIVITY_PDF: {
    accept: ".pdf",
    mimeTypes: ["application/pdf"],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: "PDF até 10MB",
  },
  ACTIVITY_DOCUMENT: {
    accept: ".pdf,.doc,.docx",
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: "PDF ou Word até 10MB",
  },
  ACTIVITY_ALL: {
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt",
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "text/plain",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: "PDF, DOC, DOCX, JPG, PNG ou TXT (máx. 10 MB)",
  },
} as const;

export type FileTypeKey = keyof typeof FILE_TYPES;

// Rate limiting para uploads
const uploadTimestamps = new Map<string, number[]>();

async function validateMagicBytes(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const mime = file.type;
  if (mime === "image/jpeg" || mime === "image/jpg")
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png")
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  if (mime === "application/pdf")
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    );
  if (mime === "image/webp") {
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
  if (mime === "application/msword")
    return (
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0
    );
  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  return true;
}

/**
 * Valida se um arquivo atende aos requisitos de tipo e tamanho
 */
export function validateFile(
  file: File,
  fileType: FileTypeKey
): { valid: boolean; error?: string } {
  const config = FILE_TYPES[fileType];

  // Validar tipo MIME
  if (!config.mimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Use: ${config.description}`,
    };
  }

  // Validar tamanho
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Valida tipo, tamanho e magic bytes do arquivo
 */
export async function validateFileWithMagicBytes(
  file: File,
  fileType: FileTypeKey
): Promise<{ valid: boolean; error?: string }> {
  const basicCheck = validateFile(file, fileType);
  if (!basicCheck.valid) return basicCheck;

  const magicOk = await validateMagicBytes(file);
  if (!magicOk) {
    return {
      valid: false,
      error: "Conteúdo do arquivo não corresponde ao tipo declarado.",
    };
  }

  return { valid: true };
}

/**
 * Verifica rate limiting para uploads
 * @param userId ID do usuário
 * @param maxUploads Número máximo de uploads permitidos
 * @param windowMs Janela de tempo em milissegundos
 */
export function checkUploadRateLimit(
  userId: string,
  maxUploads: number = 5,
  windowMs: number = 60000 // 1 minuto
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userUploads = uploadTimestamps.get(userId) || [];

  // Remover timestamps antigos (fora da janela)
  const recentUploads = userUploads.filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recentUploads.length >= maxUploads) {
    const oldestUpload = Math.min(...recentUploads);
    const retryAfter = Math.ceil((oldestUpload + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Adicionar novo timestamp
  recentUploads.push(now);
  uploadTimestamps.set(userId, recentUploads);

  // Limpar timestamps antigos periodicamente
  if (Math.random() < 0.1) {
    cleanupOldTimestamps(windowMs);
  }

  return { allowed: true };
}

/**
 * Verifica rate limit de upload server-side via check_rate_limit RPC.
 * Persiste entre reloads e abas — não bypassável pelo cliente.
 */
export async function checkUploadRateLimitServer(
  maxUploads: number = 10,
  windowMinutes: number = 1
): Promise<{ allowed: boolean; error?: string }> {
  const { error } = await supabase.rpc("check_rate_limit", {
    p_operation: "file_upload",
    p_max_requests: maxUploads,
    p_window_minutes: windowMinutes,
  });
  if (error) {
    return {
      allowed: false,
      error: "Limite de uploads atingido. Aguarde antes de tentar novamente.",
    };
  }
  return { allowed: true };
}

/**
 * Limpa timestamps antigos do Map
 */
function cleanupOldTimestamps(windowMs: number) {
  const now = Date.now();
  for (const [userId, timestamps] of uploadTimestamps.entries()) {
    const recent = timestamps.filter((t) => now - t < windowMs);
    if (recent.length === 0) {
      uploadTimestamps.delete(userId);
    } else {
      uploadTimestamps.set(userId, recent);
    }
  }
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Valida múltiplos arquivos
 */
export function validateFiles(
  files: File[],
  fileType: FileTypeKey,
  maxFiles: number = 1
): { valid: boolean; error?: string } {
  if (files.length === 0) {
    return { valid: false, error: "Nenhum arquivo selecionado" };
  }

  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Máximo de ${maxFiles} arquivo${maxFiles > 1 ? "s" : ""} permitido${maxFiles > 1 ? "s" : ""}`,
    };
  }

  for (const file of files) {
    const result = validateFile(file, fileType);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}
