/**
 * Design Tokens - Sistema de Design do EduCore
 * 
 * Centraliza todos os tokens de design para garantir consistência
 * visual e facilitar manutenção.
 */

// Tamanhos de Modais (Dialogs e Sheets)
export {
  DIALOG_SIZES,
  SHEET_SIZES,
  DIALOG_SIZE_MAP,
  SHEET_SIZE_MAP,
  MODAL_SIZES_PX,
  getDialogSizeClass,
  getSheetSizeClass,
  getDialogSizePx,
  getSheetSizePx,
  type DialogSize,
  type SheetSize,
} from './modal-sizes';

// Tamanhos de Colunas de Tabela
export {
  TABLE_COLUMN_SIZES,
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  STICKY_HEADER,
  TABLE_HEAD_BASE,
  getColumnStyle,
  getXLColumnClasses,
  calculateTableMinWidth,
} from './table-columns';

// Typography (Hierarquia Tipográfica)
export {
  TYPOGRAPHY,
  FONT_WEIGHTS,
  TEXT_COLORS,
  TYPOGRAPHY_SIZES_PX,
  typography,
  typographyWithColor,
  typographyWithWeight,
  customTypography,
  type TypographyVariant,
  type FontWeight,
  type TextColor,
} from './typography';

// Spacing (Espaçamento e Ritmo Visual)
export {
  STACK,
  GAP,
  CONTAINER,
  PADDING_X,
  PADDING_Y,
  MARGIN_TOP,
  MARGIN_BOTTOM,
  SPACING_SCALE_PX,
  stack,
  gap,
  container,
  paddingX,
  paddingY,
  padding,
  marginTop,
  marginBottom,
  type StackSize,
  type GapSize,
  type ContainerSize,
  type PaddingXSize,
  type PaddingYSize,
  type MarginTopSize,
  type MarginBottomSize,
} from './spacing';

// Icon Sizes (Tamanhos de Ícones)
export {
  ICON_SIZES,
  ICON_SIZES_PX,
  iconSize,
  getIconSizePx,
  type IconSize,
} from './icon-sizes';

// ============================================================================
// ROADMAP - Próximos Tokens a Implementar
// ============================================================================

/**
 * TODO: Component Size Tokens
 * - Tamanhos de botões, inputs, selects
 * - Arquivo: component-sizes.ts
 */
