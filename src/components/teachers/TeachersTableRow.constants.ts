import { TABLE_COLUMN_SIZES } from "@/lib/design-tokens/table-columns";

export const COL = {
  STATUS_BADGE: "1%",                   // Badge de status (width: 1%)
  NOME: TABLE_COLUMN_SIZES.XL_STICKY,   // XL (Sticky): 360px - Nome do professor (sticky)
  EMAIL: TABLE_COLUMN_SIZES.L,          // L (Grande): 240px - Email
  TELEFONE: TABLE_COLUMN_SIZES.M,       // M (Médio): 140px - Telefone
  TOTAL_ALUNOS: TABLE_COLUMN_SIZES.S,   // S (Pequeno): 110px - Total de alunos
  TOTAL_AULAS: TABLE_COLUMN_SIZES.S,    // S (Pequeno): 110px - Total de aulas
  VALOR_RECEBIDO: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Valor recebido
  PLACEHOLDER: TABLE_COLUMN_SIZES.S,    // S (Pequeno): 110px - Coluna vazia
  ACOES: TABLE_COLUMN_SIZES.XS,         // XS (Mini): 90px - Ações
} as const;

export const TABLE_MIN_W = "1480px";

// Re-export para manter compatibilidade com imports existentes
export { COL as default };
