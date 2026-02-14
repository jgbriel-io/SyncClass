/**
 * Design Tokens: Tamanhos de Modais
 * 
 * Centraliza os tamanhos de Dialogs (centrais) e Sheets (laterais)
 * para garantir consistência e facilitar manutenção.
 */

// ============================================================================
// DIALOG SIZES (Modais Centrais)
// ============================================================================

/**
 * Tamanhos para Dialogs (modais que aparecem no centro da tela)
 * 
 * - SM: Formulários simples (poucos campos)
 * - MD: Formulários médios (cadastros)
 * - LG: Formulários complexos (visualização + formulário)
 */
export const DIALOG_SIZES = {
  SM: "sm:max-w-md",   // 448px - Formulários simples
  MD: "sm:max-w-lg",   // 512px - Formulários médios
  LG: "sm:max-w-2xl",  // 672px - Formulários complexos
} as const;

export type DialogSize = keyof typeof DIALOG_SIZES;

/**
 * Mapeamento de tamanhos semânticos para classes Tailwind
 * Usado internamente pelo BaseDialog
 */
export const DIALOG_SIZE_MAP: Record<DialogSize, string> = {
  SM: DIALOG_SIZES.SM,
  MD: DIALOG_SIZES.MD,
  LG: DIALOG_SIZES.LG,
};

// ============================================================================
// SHEET SIZES (Modais Laterais)
// ============================================================================

/**
 * Tamanhos para Sheets (modais que deslizam da lateral)
 * 
 * - DEFAULT: Visualização padrão
 * - LG: Visualização com mais informações
 * - XL: Visualização completa (múltiplas tabs)
 * - FULL: Ocupa toda a largura
 */
export const SHEET_SIZES = {
  DEFAULT: "sm:max-w-lg",   // 512px - Visualização padrão
  LG: "sm:max-w-xl",        // 640px - Visualização média
  XL: "sm:max-w-2xl",       // 672px - Visualização completa
  FULL: "sm:max-w-full",    // 100% - Largura total
} as const;

export type SheetSize = keyof typeof SHEET_SIZES;

/**
 * Mapeamento de tamanhos semânticos para classes Tailwind
 * Usado internamente pelo BaseDetailSheet
 */
export const SHEET_SIZE_MAP: Record<SheetSize, string> = {
  DEFAULT: SHEET_SIZES.DEFAULT,
  LG: SHEET_SIZES.LG,
  XL: SHEET_SIZES.XL,
  FULL: SHEET_SIZES.FULL,
};

// ============================================================================
// VALORES EM PIXELS (Referência)
// ============================================================================

/**
 * Valores em pixels para referência
 * (Não usar diretamente, usar as constantes acima)
 */
export const MODAL_SIZES_PX = {
  // Dialogs
  DIALOG_SM: 448,
  DIALOG_MD: 512,
  DIALOG_LG: 672,
  
  // Sheets
  SHEET_DEFAULT: 512,
  SHEET_LG: 640,
  SHEET_XL: 672,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retorna a classe Tailwind para um tamanho de Dialog
 * @param size - Tamanho do Dialog (SM, MD, LG)
 */
export function getDialogSizeClass(size: DialogSize): string {
  return DIALOG_SIZE_MAP[size];
}

/**
 * Retorna a classe Tailwind para um tamanho de Sheet
 * @param size - Tamanho do Sheet (DEFAULT, LG, XL, FULL)
 */
export function getSheetSizeClass(size: SheetSize): string {
  return SHEET_SIZE_MAP[size];
}

/**
 * Retorna o valor em pixels para um tamanho de Dialog
 * @param size - Tamanho do Dialog (SM, MD, LG)
 */
export function getDialogSizePx(size: DialogSize): number {
  const map: Record<DialogSize, number> = {
    SM: MODAL_SIZES_PX.DIALOG_SM,
    MD: MODAL_SIZES_PX.DIALOG_MD,
    LG: MODAL_SIZES_PX.DIALOG_LG,
  };
  return map[size];
}

/**
 * Retorna o valor em pixels para um tamanho de Sheet
 * @param size - Tamanho do Sheet (DEFAULT, LG, XL)
 */
export function getSheetSizePx(size: SheetSize): number | null {
  const map: Record<SheetSize, number | null> = {
    DEFAULT: MODAL_SIZES_PX.SHEET_DEFAULT,
    LG: MODAL_SIZES_PX.SHEET_LG,
    XL: MODAL_SIZES_PX.SHEET_XL,
    FULL: null, // Full width não tem valor fixo
  };
  return map[size];
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/**
 * Exemplo de uso no BaseDialog:
 * 
 * import { DIALOG_SIZE_MAP, DialogSize } from '@/lib/design-tokens/modal-sizes';
 * 
 * interface BaseDialogProps {
 *   size?: DialogSize;
 * }
 * 
 * function BaseDialog({ size = 'SM' }: BaseDialogProps) {
 *   return (
 *     <DialogContent className={DIALOG_SIZE_MAP[size]}>
 *       ...
 *     </DialogContent>
 *   );
 * }
 */

/**
 * Exemplo de uso no BaseDetailSheet:
 * 
 * import { SHEET_SIZE_MAP, SheetSize } from '@/lib/design-tokens/modal-sizes';
 * 
 * interface BaseDetailSheetProps {
 *   size?: SheetSize;
 * }
 * 
 * function BaseDetailSheet({ size = 'DEFAULT' }: BaseDetailSheetProps) {
 *   return (
 *     <SheetContent className={SHEET_SIZE_MAP[size]}>
 *       ...
 *     </SheetContent>
 *   );
 * }
 */
