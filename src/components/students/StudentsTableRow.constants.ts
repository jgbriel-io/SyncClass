import { TABLE_COLUMN_SIZES } from "@/lib/design-tokens/table-columns";

export const COL = {
  STATUS_BADGE: "1%",                   // Badge de status (width: 1%)
  NOME: TABLE_COLUMN_SIZES.XL_STICKY,   // XL (Sticky): 360px - Nome do aluno (sticky)
  PROFESSOR: TABLE_COLUMN_SIZES.M,      // M (Médio): 140px - Nome do professor
  TELEFONE: TABLE_COLUMN_SIZES.M,       // M (Médio): 140px - Telefone
  ORIGEM: TABLE_COLUMN_SIZES.S,         // S (Pequeno): 110px - Origem
  ULTIMA_AULA: TABLE_COLUMN_SIZES.M,    // M (Médio): 140px - Data da última aula
  ULTIMO_PAGAMENTO: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Data do último pagamento
  ACOES: TABLE_COLUMN_SIZES.XS,         // XS (Mini): 90px - Ações
} as const;

export const TABLE_MIN_W = "1280px";

// Re-export para manter compatibilidade com imports existentes
export { COL as default };
