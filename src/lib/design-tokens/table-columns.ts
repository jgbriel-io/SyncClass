/**
 * Sistema de Design Tokens para Colunas de Tabela
 * Baseado em T-Shirt Sizes (XL a XS)
 * 
 * Garante ritmo visual consistente e comportamento de scroll padronizado
 * em todas as tabelas do sistema.
 */

// ============================================================================
// DESIGN TOKENS - T-SHIRT SIZES
// ============================================================================

export const TABLE_COLUMN_SIZES = {
  /** XL (Sticky): 280px desktop, 360px xl+ - Primeira coluna (Identificador principal) */
  XL: 280,
  XL_DESKTOP: 360,
  
  /** L (Grande): 240px - Descrições, e-mails, títulos longos */
  L: 240,
  
  /** M (Médio): 140px - Datas, status com badges, informações financeiras */
  M: 140,
  
  /** S (Pequeno): 110px - Moedas, notas, médias, contadores */
  S: 110,
  
  /** XS (Mini): 90px - Coluna de Ações e dias do mês */
  XS: 90,
} as const;

// ============================================================================
// CLASSES TAILWIND REUTILIZÁVEIS
// ============================================================================

/** Classe base para todas as células */
export const CELL_BASE = "px-2 py-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2 align-middle text-left text-xs whitespace-nowrap";

/** Classe para célula sticky (primeira coluna) */
export const STICKY_CELL = "sticky left-0 z-20 bg-card group-hover:bg-muted transition-colors";

/** Sombra para célula sticky */
export const STICKY_SHADOW = { boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" };

/** Classe para header sticky */
export const STICKY_HEADER = "sticky left-0 z-30 bg-muted";

/** Classe base para TableHead */
export const TABLE_HEAD_BASE = "text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retorna o estilo inline para uma coluna baseado no token
 * @param size - Tamanho do token (XL, L, M, S, XS)
 * @param responsive - Se true, aplica xl:w-[360px] para XL
 */
export function getColumnStyle(size: keyof typeof TABLE_COLUMN_SIZES, responsive = false) {
  const width = TABLE_COLUMN_SIZES[size];
  
  if (size === 'XL' && responsive) {
    return {
      width,
      minWidth: width,
    };
  }
  
  return {
    width,
    minWidth: width,
  };
}

/**
 * Retorna classes Tailwind para coluna XL (sticky)
 * Inclui responsividade desktop (360px)
 */
export function getXLColumnClasses() {
  return "w-[280px] min-w-[280px] max-w-[280px] desktop:w-[360px] desktop:min-w-[360px] desktop:max-w-[360px]";
}

/**
 * Calcula o min-width total da tabela baseado nos tokens usados
 * @param columns - Array de tokens usados na tabela
 */
export function calculateTableMinWidth(columns: (keyof typeof TABLE_COLUMN_SIZES)[]): number {
  return columns.reduce((total, col) => total + TABLE_COLUMN_SIZES[col], 0);
}

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/**
 * Exemplo de mapeamento de colunas para uma tabela:
 * 
 * const COLUMNS = {
 *   ALUNO: 'XL',      // Sticky, identificador principal
 *   EMAIL: 'L',       // Descrição longa
 *   DATA: 'M',        // Data
 *   VALOR: 'S',       // Moeda
 *   ACOES: 'XS',      // Ações
 * } as const;
 * 
 * const TABLE_MIN_W = calculateTableMinWidth(['XL', 'L', 'M', 'S', 'XS']);
 */
