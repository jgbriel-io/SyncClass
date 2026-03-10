/**
 * Validação e redimensionamento de foto de perfil.
 * Limites: tamanho em bytes e dimensão máxima em pixels.
 */

export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const AVATAR_MAX_PX = 512; // largura e altura máximas em pixels
export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface AvatarValidationError {
  code: "type" | "size" | "dimensions";
  message: string;
}

/**
 * Valida o arquivo (tipo e tamanho) e, se necessário, redimensiona para caber em AVATAR_MAX_PX.
 * Retorna o blob pronto para upload ou lança/retorna erro.
 */
export function validateAndResizeAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number])) {
      reject({
        code: "type" as const,
        message: `Formato inválido. Use ${AVATAR_ALLOWED_TYPES.join(", ")}.`,
      } as AvatarValidationError);
      return;
    }
    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      reject({
        code: "size" as const,
        message: `Arquivo muito grande. Máximo ${AVATAR_MAX_SIZE_BYTES / 1024 / 1024} MB.`,
      } as AvatarValidationError);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      if (w > AVATAR_MAX_PX || h > AVATAR_MAX_PX) {
        const blob = resizeImageToMaxPx(img, file.type);
        blob.then(resolve).catch(reject);
        return;
      }
      resolve(file);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject({ code: "type" as const, message: "Não foi possível ler a imagem." } as AvatarValidationError);
    };

    img.src = url;
  });
}

function resizeImageToMaxPx(img: HTMLImageElement, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.min(AVATAR_MAX_PX / w, AVATAR_MAX_PX / h, 1);
    const outW = Math.round(w * scale);
    const outH = Math.round(h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas não disponível"));
      return;
    }
    ctx.drawImage(img, 0, 0, outW, outH);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar imagem"));
      },
      mimeType,
      0.9
    );
  });
}
