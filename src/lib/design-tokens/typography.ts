/**
 * Design Tokens: Typography
 * 
 * Sistema de hierarquia tipográfica para garantir consistência
 * visual em todo o projeto.
 * 
 * Baseado em uma escala modular que facilita leitura e hierarquia.
 */

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

/**
 * Hierarquia tipográfica do sistema
 * 
 * Uso:
 * - DISPLAY: Títulos de landing pages, hero sections
 * - H1: Títulos de páginas principais
 * - H2: Títulos de seções
 * - H3: Subtítulos, títulos de cards
 * - BODY: Texto padrão do sistema (14px)
 * - CAPTION: Labels, legendas, metadados (12px)
 * - SMALL: Texto secundário, hints (12px com cor muted)
 */
export const TYPOGRAPHY = {
  // Títulos
  DISPLAY: "text-4xl font-bold",           // 36px - Hero, landing pages
  H1: "text-2xl font-semibold",            // 24px - Títulos de página
  H2: "text-xl font-semibold",             // 20px - Títulos de seção
  H3: "text-lg font-medium",               // 18px - Subtítulos, cards
  
  // Corpo de texto
  BODY: "text-sm",                         // 14px - Texto padrão
  BODY_MEDIUM: "text-sm font-medium",      // 14px - Texto com ênfase
  BODY_SEMIBOLD: "text-sm font-semibold",  // 14px - Texto destacado
  
  // Texto pequeno
  CAPTION: "text-xs",                      // 12px - Labels, legendas
  CAPTION_MEDIUM: "text-xs font-medium",   // 12px - Labels com ênfase
  CAPTION_SEMIBOLD: "text-xs font-semibold", // 12px - Labels destacados
  
  // Texto secundário
  SMALL: "text-xs text-muted-foreground",  // 12px - Texto secundário
  SMALL_MEDIUM: "text-xs font-medium text-muted-foreground", // 12px - Secundário com ênfase
  
  // Texto muito pequeno (11px)
  MICRO: "text-[11px] leading-tight",      // 11px - Texto muito pequeno (timestamps, metadados)
  MICRO_MUTED: "text-[11px] leading-tight text-muted-foreground", // 11px - Micro secundário
  
  // Texto de tabela (uppercase)
  TABLE_HEADER: "text-xs font-medium text-muted-foreground uppercase tracking-wider",
  
  // Texto de formulário
  LABEL: "text-sm font-medium",            // Labels de formulário
  HELPER: "text-xs text-muted-foreground", // Texto de ajuda
  ERROR: "text-sm text-destructive",       // Mensagens de erro
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;

// ============================================================================
// FONT WEIGHTS
// ============================================================================

/**
 * Pesos de fonte disponíveis
 * (Geist Sans suporta 400, 500, 600, 700)
 */
export const FONT_WEIGHTS = {
  NORMAL: "font-normal",       // 400
  MEDIUM: "font-medium",       // 500
  SEMIBOLD: "font-semibold",   // 600
  BOLD: "font-bold",           // 700
} as const;

export type FontWeight = keyof typeof FONT_WEIGHTS;

// ============================================================================
// TEXT COLORS
// ============================================================================

/**
 * Cores de texto semânticas
 */
export const TEXT_COLORS = {
  DEFAULT: "text-foreground",
  MUTED: "text-muted-foreground",
  PRIMARY: "text-primary",
  SUCCESS: "text-success",
  WARNING: "text-warning",
  DESTRUCTIVE: "text-destructive",
  ACCENT: "text-accent-foreground",
} as const;

export type TextColor = keyof typeof TEXT_COLORS;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retorna a classe Tailwind para uma variante tipográfica
 * @param variant - Variante tipográfica (DISPLAY, H1, H2, etc.)
 */
export function typography(variant: TypographyVariant): string {
  return TYPOGRAPHY[variant];
}

/**
 * Combina uma variante tipográfica com uma cor
 * @param variant - Variante tipográfica
 * @param color - Cor do texto
 */
export function typographyWithColor(variant: TypographyVariant, color: TextColor): string {
  return `${TYPOGRAPHY[variant]} ${TEXT_COLORS[color]}`;
}

/**
 * Combina uma variante tipográfica com um peso customizado
 * @param variant - Variante tipográfica base
 * @param weight - Peso da fonte
 */
export function typographyWithWeight(variant: TypographyVariant, weight: FontWeight): string {
  // Remove o peso existente da variante e adiciona o novo
  const baseClasses = TYPOGRAPHY[variant].replace(/font-(normal|medium|semibold|bold)/g, '').trim();
  return `${baseClasses} ${FONT_WEIGHTS[weight]}`;
}

/**
 * Cria uma classe tipográfica customizada
 * @param size - Tamanho do texto (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
 * @param weight - Peso da fonte (opcional)
 * @param color - Cor do texto (opcional)
 */
export function customTypography(
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl',
  weight?: FontWeight,
  color?: TextColor
): string {
  const classes = [`text-${size}`];
  if (weight) classes.push(FONT_WEIGHTS[weight]);
  if (color) classes.push(TEXT_COLORS[color]);
  return classes.join(' ');
}

// ============================================================================
// VALORES EM PIXELS (Referência)
// ============================================================================

/**
 * Valores em pixels para referência
 * (Não usar diretamente, usar as constantes acima)
 */
export const TYPOGRAPHY_SIZES_PX = {
  DISPLAY: 36,  // text-4xl
  H1: 24,       // text-2xl
  H2: 20,       // text-xl
  H3: 18,       // text-lg
  BODY: 14,     // text-sm
  CAPTION: 12,  // text-xs
} as const;

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/**
 * Exemplo 1: Uso básico
 * 
 * import { typography } from '@/lib/design-tokens/typography';
 * 
 * <h1 className={typography('H1')}>Título da Página</h1>
 * <p className={typography('BODY')}>Texto padrão</p>
 * <span className={typography('CAPTION')}>Legenda</span>
 */

/**
 * Exemplo 2: Com cor customizada
 * 
 * import { typographyWithColor } from '@/lib/design-tokens/typography';
 * 
 * <p className={typographyWithColor('BODY', 'MUTED')}>Texto secundário</p>
 * <span className={typographyWithColor('CAPTION', 'DESTRUCTIVE')}>Erro</span>
 */

/**
 * Exemplo 3: Com peso customizado
 * 
 * import { typographyWithWeight } from '@/lib/design-tokens/typography';
 * 
 * <p className={typographyWithWeight('BODY', 'BOLD')}>Texto em negrito</p>
 */

/**
 * Exemplo 4: Customizado
 * 
 * import { customTypography } from '@/lib/design-tokens/typography';
 * 
 * <span className={customTypography('xs', 'MEDIUM', 'PRIMARY')}>
 *   Texto pequeno, médio, primário
 * </span>
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * Guia de migração do código antigo para os novos tokens:
 * 
 * ANTES                                    DEPOIS
 * ---------------------------------------- ----------------------------------------
 * className="text-4xl font-bold"           className={typography('DISPLAY')}
 * className="text-2xl font-semibold"       className={typography('H1')}
 * className="text-xl font-semibold"        className={typography('H2')}
 * className="text-lg font-medium"          className={typography('H3')}
 * className="text-sm"                      className={typography('BODY')}
 * className="text-sm font-medium"          className={typography('BODY_MEDIUM')}
 * className="text-xs"                      className={typography('CAPTION')}
 * className="text-xs font-medium"          className={typography('CAPTION_MEDIUM')}
 * className="text-xs text-muted-foreground" className={typography('SMALL')}
 * 
 * // Labels de formulário
 * className="text-sm font-medium"          className={typography('LABEL')}
 * 
 * // Erros de formulário
 * className="text-sm text-destructive"     className={typography('ERROR')}
 * 
 * // Headers de tabela
 * className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
 *   → className={typography('TABLE_HEADER')}
 */
