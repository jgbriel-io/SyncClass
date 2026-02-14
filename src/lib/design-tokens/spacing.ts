/**
 * Design Tokens: Spacing
 * 
 * Sistema de espaçamento para garantir ritmo visual consistente
 * em todo o projeto.
 * 
 * Baseado em uma escala de 4px (0.25rem) para manter harmonia.
 */

// ============================================================================
// VERTICAL SPACING (space-y)
// ============================================================================

/**
 * Espaçamento vertical entre elementos empilhados
 * 
 * Uso:
 * - TIGHT: Formulários, inputs relacionados (8px)
 * - DEFAULT: Seções de conteúdo (16px)
 * - LOOSE: Separação entre seções principais (24px)
 * - RELAXED: Páginas, grandes blocos (32px)
 */
export const STACK = {
  TIGHT: "space-y-2",      // 8px - Formulários, inputs
  DEFAULT: "space-y-4",    // 16px - Seções padrão
  LOOSE: "space-y-6",      // 24px - Seções principais
  RELAXED: "space-y-8",    // 32px - Páginas, grandes blocos
} as const;

export type StackSize = keyof typeof STACK;

// ============================================================================
// GAP (Flexbox/Grid)
// ============================================================================

/**
 * Espaçamento entre elementos em flex/grid
 * 
 * Uso:
 * - TIGHT: Ícone + texto, badges (8px)
 * - DEFAULT: Botões, cards em grid (12px)
 * - LOOSE: Seções lado a lado (16px)
 * - RELAXED: Grandes blocos (24px)
 */
export const GAP = {
  TIGHT: "gap-2",          // 8px - Ícone + texto
  DEFAULT: "gap-3",        // 12px - Padrão
  LOOSE: "gap-4",          // 16px - Seções
  RELAXED: "gap-6",        // 24px - Grandes blocos
} as const;

export type GapSize = keyof typeof GAP;

// ============================================================================
// PADDING (Containers)
// ============================================================================

/**
 * Padding de containers e cards
 * 
 * Uso:
 * - SM: Badges, chips, botões pequenos
 * - DEFAULT: Cards, modais, seções
 * - LG: Páginas, containers principais
 */
export const CONTAINER = {
  SM: "px-4 py-3",         // 16px/12px - Pequeno
  DEFAULT: "px-6 py-4",    // 24px/16px - Padrão
  LG: "px-8 py-6",         // 32px/24px - Grande
} as const;

export type ContainerSize = keyof typeof CONTAINER;

/**
 * Padding apenas horizontal
 */
export const PADDING_X = {
  SM: "px-2",              // 8px
  DEFAULT: "px-4",         // 16px
  MD: "px-6",              // 24px
  LG: "px-8",              // 32px
} as const;

export type PaddingXSize = keyof typeof PADDING_X;

/**
 * Padding apenas vertical
 */
export const PADDING_Y = {
  SM: "py-2",              // 8px
  DEFAULT: "py-4",         // 16px
  MD: "py-6",              // 24px
  LG: "py-8",              // 32px
} as const;

export type PaddingYSize = keyof typeof PADDING_Y;

// ============================================================================
// MARGIN
// ============================================================================

/**
 * Margens para casos especiais
 * (Preferir gap/space-y quando possível)
 */
export const MARGIN = {
  SM: "m-2",               // 8px
  DEFAULT: "m-4",          // 16px
  LG: "m-6",               // 24px
} as const;

export type MarginSize = keyof typeof MARGIN;

/**
 * Margin top
 */
export const MARGIN_TOP = {
  SM: "mt-2",              // 8px
  DEFAULT: "mt-4",         // 16px
  MD: "mt-6",              // 24px
  LG: "mt-8",              // 32px
} as const;

export type MarginTopSize = keyof typeof MARGIN_TOP;

/**
 * Margin bottom
 */
export const MARGIN_BOTTOM = {
  SM: "mb-2",              // 8px
  DEFAULT: "mb-4",         // 16px
  MD: "mb-6",              // 24px
  LG: "mb-8",              // 32px
} as const;

export type MarginBottomSize = keyof typeof MARGIN_BOTTOM;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retorna a classe de espaçamento vertical
 * @param size - Tamanho do espaçamento (TIGHT, DEFAULT, LOOSE, RELAXED)
 */
export function stack(size: StackSize): string {
  return STACK[size];
}

/**
 * Retorna a classe de gap
 * @param size - Tamanho do gap (TIGHT, DEFAULT, LOOSE, RELAXED)
 */
export function gap(size: GapSize): string {
  return GAP[size];
}

/**
 * Retorna a classe de padding de container
 * @param size - Tamanho do container (SM, DEFAULT, LG)
 */
export function container(size: ContainerSize): string {
  return CONTAINER[size];
}

/**
 * Retorna a classe de padding horizontal
 * @param size - Tamanho do padding (SM, DEFAULT, MD, LG)
 */
export function paddingX(size: PaddingXSize): string {
  return PADDING_X[size];
}

/**
 * Retorna a classe de padding vertical
 * @param size - Tamanho do padding (SM, DEFAULT, MD, LG)
 */
export function paddingY(size: PaddingYSize): string {
  return PADDING_Y[size];
}

/**
 * Combina padding horizontal e vertical
 * @param x - Tamanho horizontal
 * @param y - Tamanho vertical
 */
export function padding(x: PaddingXSize, y: PaddingYSize): string {
  return `${PADDING_X[x]} ${PADDING_Y[y]}`;
}

/**
 * Retorna a classe de margin top
 * @param size - Tamanho da margin (SM, DEFAULT, MD, LG)
 */
export function marginTop(size: MarginTopSize): string {
  return MARGIN_TOP[size];
}

/**
 * Retorna a classe de margin bottom
 * @param size - Tamanho da margin (SM, DEFAULT, MD, LG)
 */
export function marginBottom(size: MarginBottomSize): string {
  return MARGIN_BOTTOM[size];
}

// ============================================================================
// VALORES EM PIXELS (Referência)
// ============================================================================

/**
 * Valores em pixels para referência
 * (Não usar diretamente, usar as constantes acima)
 */
export const SPACING_SCALE_PX = {
  2: 8,    // space-y-2, gap-2, px-2, py-2
  3: 12,   // gap-3
  4: 16,   // space-y-4, gap-4, px-4, py-4
  6: 24,   // space-y-6, gap-6, px-6, py-6
  8: 32,   // space-y-8, px-8, py-8
} as const;

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/**
 * Exemplo 1: Espaçamento vertical (formulário)
 * 
 * import { stack } from '@/lib/design-tokens/spacing';
 * 
 * <form className={stack('TIGHT')}>
 *   <input />
 *   <input />
 *   <button />
 * </form>
 */

/**
 * Exemplo 2: Gap em flex
 * 
 * import { gap } from '@/lib/design-tokens/spacing';
 * 
 * <div className={`flex items-center ${gap('DEFAULT')}`}>
 *   <Icon />
 *   <span>Texto</span>
 * </div>
 */

/**
 * Exemplo 3: Padding de container
 * 
 * import { container } from '@/lib/design-tokens/spacing';
 * 
 * <div className={container('DEFAULT')}>
 *   Conteúdo do card
 * </div>
 */

/**
 * Exemplo 4: Padding customizado
 * 
 * import { padding } from '@/lib/design-tokens/spacing';
 * 
 * <div className={padding('MD', 'DEFAULT')}>
 *   px-6 py-4
 * </div>
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * Guia de migração do código antigo para os novos tokens:
 * 
 * ANTES                          DEPOIS
 * ------------------------------ ------------------------------
 * className="space-y-2"          className={stack('TIGHT')}
 * className="space-y-4"          className={stack('DEFAULT')}
 * className="space-y-6"          className={stack('LOOSE')}
 * className="space-y-8"          className={stack('RELAXED')}
 * 
 * className="gap-2"              className={gap('TIGHT')}
 * className="gap-3"              className={gap('DEFAULT')}
 * className="gap-4"              className={gap('LOOSE')}
 * className="gap-6"              className={gap('RELAXED')}
 * 
 * className="px-4 py-3"          className={container('SM')}
 * className="px-6 py-4"          className={container('DEFAULT')}
 * className="px-8 py-6"          className={container('LG')}
 * 
 * className="px-6"               className={paddingX('MD')}
 * className="py-4"               className={paddingY('DEFAULT')}
 * className="px-6 py-4"          className={padding('MD', 'DEFAULT')}
 */

// ============================================================================
// DESIGN PRINCIPLES
// ============================================================================

/**
 * Princípios de Espaçamento:
 * 
 * 1. **Escala de 4px**: Todos os valores são múltiplos de 4px
 * 2. **Hierarquia Clara**: TIGHT < DEFAULT < LOOSE < RELAXED
 * 3. **Consistência**: Usar os mesmos valores em contextos similares
 * 4. **Ritmo Visual**: Espaçamento cria hierarquia e respiração
 * 5. **Preferir Gap/Space-y**: Evitar margin quando possível
 * 
 * Quando usar cada tipo:
 * - **space-y**: Elementos empilhados verticalmente (formulários, listas)
 * - **gap**: Elementos em flex/grid (botões, cards, ícone+texto)
 * - **padding**: Espaço interno de containers (cards, modais, seções)
 * - **margin**: Casos especiais (preferir gap/space-y)
 */
