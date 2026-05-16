import { TABLE_COLUMN_SIZES } from "@/lib/design-tokens/table-columns";

export const COL = {
  STATUS_BADGE: "1%",                   // Badge de status (width: 1%)
  ALUNO: TABLE_COLUMN_SIZES.XL_STICKY,  // XL (Sticky): 360px - Nome do aluno (sticky)
  PROFESSOR: TABLE_COLUMN_SIZES.M,      // M (Médio): 140px - Nome do professor
  VALOR_HORA: TABLE_COLUMN_SIZES.M,     // M (Médio): 140px - Valor por hora
  AULAS_SEMANA: TABLE_COLUMN_SIZES.S,   // S (Pequeno): 110px - Aulas por semana
  TOTAL_MENSAL: TABLE_COLUMN_SIZES.M,   // M (Médio): 140px - Total mensal
  DIA_PAGTO: TABLE_COLUMN_SIZES.S,      // S (Pequeno): 110px - Dia de pagamento
  FINANCEIRO: TABLE_COLUMN_SIZES.M,     // M (Médio): 140px - Status financeiro
  ULTIMA_AULA: TABLE_COLUMN_SIZES.M,    // M (Médio): 140px - Data da última aula
  ACOES: TABLE_COLUMN_SIZES.XS,         // XS (Mini): 90px - Ações
} as const;

export const TABLE_MIN_W = "1280px";

// Re-export para manter compatibilidade com imports existentes
export { COL as default };
