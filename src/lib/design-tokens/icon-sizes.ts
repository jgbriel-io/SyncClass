/**
 * Design Tokens: Icon Sizes
 * 
 * Sistema de tamanhos de ícones para garantir consistência visual
 * em todo o projeto.
 * 
 * Baseado nos tamanhos mais usados no projeto (h-4 w-4, h-6 w-6, etc.)
 */

// ============================================================================
// ICON SIZES
// ============================================================================

/**
 * Tamanhos de ícones padronizados
 * 
 * Uso:
 * - XS: Ícones muito pequenos (14px) - Indicadores, checkboxes
 * - SM: Ícones pequenos (16px) - Padrão, mais usado
 * - MD: Ícones médios (20px) - Botões maiores, headers
 * - LG: Ícones grandes (24px) - Logos, features
 * - XL: Ícones muito grandes (32px) - Hero sections, ilustrações
 */
export const ICON_SIZES = {
  XS: "h-3.5 w-3.5",   // 14px - Indicadores, checkboxes
  SM: "h-4 w-4",       // 16px - Padrão (mais usado)
  MD: "h-5 w-5",       // 20px - Botões maiores
  LG: "h-6 w-6",       // 24px - Logos, features
  XL: "h-8 w-8",       // 32px - Hero sections
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// ============================================================================
// VALORES EM PIXELS (Referência)
// ============================================================================

/**
 * Valores em pixels para referência
 * (Não usar diretamente, usar as constantes acima)
 */
export const ICON_SIZES_PX = {
  XS: 14,   // h-3.5 w-3.5
  SM: 16,   // h-4 w-4
  MD: 20,   // h-5 w-5
  LG: 24,   // h-6 w-6
  XL: 32,   // h-8 w-8
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retorna a classe de tamanho de ícone
 * @param size - Tamanho do ícone (XS, SM, MD, LG, XL)
 * @returns Classe Tailwind para o tamanho (ex: "h-4 w-4")
 * 
 * @example
 * ```tsx
 * import { iconSize } from '@/lib/design-tokens/icon-sizes';
 * 
 * <Icon className={iconSize('SM')} />
 * ```
 */
export function iconSize(size: IconSize): string {
  return ICON_SIZES[size];
}

/**
 * Retorna o valor em pixels do tamanho do ícone
 * @param size - Tamanho do ícone (XS, SM, MD, LG, XL)
 * @returns Valor em pixels
 * 
 * @example
 * ```tsx
 * import { getIconSizePx } from '@/lib/design-tokens/icon-sizes';
 * 
 * const size = getIconSizePx('SM'); // 16
 * ```
 */
export function getIconSizePx(size: IconSize): number {
  return ICON_SIZES_PX[size];
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/**
 * Exemplo 1: Ícone padrão (mais comum)
 * 
 * import { iconSize } from '@/lib/design-tokens/icon-sizes';
 * 
 * <Eye className={iconSize('SM')} />
 */

/**
 * Exemplo 2: Ícone em botão
 * 
 * import { iconSize } from '@/lib/design-tokens/icon-sizes';
 * 
 * <Button>
 *   <Plus className={iconSize('SM')} />
 *   Adicionar
 * </Button>
 */

/**
 * Exemplo 3: Logo
 * 
 * import { iconSize } from '@/lib/design-tokens/icon-sizes';
 * 
 * <GraduationCap className={iconSize('LG')} />
 */

/**
 * Exemplo 4: Ícone com outras classes
 * 
 * import { iconSize } from '@/lib/design-tokens/icon-sizes';
 * 
 * <Icon className={`${iconSize('SM')} text-muted-foreground`} />
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * Guia de migração do código antigo para os novos tokens:
 * 
 * ANTES                          DEPOIS
 * ------------------------------ ------------------------------
 * className="h-3.5 w-3.5"        className={iconSize('XS')}
 * className="h-4 w-4"            className={iconSize('SM')}
 * className="h-5 w-5"            className={iconSize('MD')}
 * className="h-6 w-6"            className={iconSize('LG')}
 * className="h-8 w-8"            className={iconSize('XL')}
 * 
 * Com outras classes:
 * className="h-4 w-4 text-muted-foreground"
 * className={`${iconSize('SM')} text-muted-foreground`}
 * 
 * Ou usando template literal:
 * className={`${iconSize('SM')} text-primary`}
 */

// ============================================================================
// DESIGN PRINCIPLES
// ============================================================================

/**
 * Princípios de Icon Sizes:
 * 
 * 1. **Consistência**: Usar os mesmos tamanhos em contextos similares
 * 2. **Hierarquia Clara**: XS < SM < MD < LG < XL
 * 3. **Padrão SM**: 16px (h-4 w-4) é o tamanho mais usado (80% dos casos)
 * 4. **Escala Proporcional**: Cada tamanho tem propósito específico
 * 5. **Acessibilidade**: Ícones devem ter tamanho mínimo de 14px (XS)
 * 
 * Quando usar cada tamanho:
 * - **XS (14px)**: Indicadores, checkboxes, ícones em badges
 * - **SM (16px)**: Ícones padrão, botões, inputs, menus (MAIS USADO)
 * - **MD (20px)**: Botões maiores, headers de seções
 * - **LG (24px)**: Logos, features, ícones de destaque
 * - **XL (32px)**: Hero sections, ilustrações, ícones grandes
 * 
 * Contextos comuns:
 * - Botões: SM (16px)
 * - Inputs: SM (16px)
 * - Menus/Dropdowns: SM (16px)
 * - Logos: LG (24px) ou XL (32px)
 * - Close buttons: SM (16px)
 * - Checkboxes/Radio: XS (14px)
 * - Features/Cards: LG (24px)
 */

// ============================================================================
// USAGE STATISTICS (Referência)
// ============================================================================

/**
 * Estatísticas de uso no projeto (antes da tokenização):
 * 
 * - h-4 w-4 (16px): ~80% dos casos (MAIS USADO)
 * - h-6 w-6 (24px): ~10% dos casos
 * - h-8 w-8 (32px): ~5% dos casos
 * - h-5 w-5 (20px): ~3% dos casos
 * - h-3.5 w-3.5 (14px): ~2% dos casos
 * 
 * Isso confirma que SM (16px) deve ser o padrão.
 */
