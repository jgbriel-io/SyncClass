import { TABLE_COLUMN_SIZES } from "@/lib/design-tokens/table-columns";

export const COL = {
  ALUNO: TABLE_COLUMN_SIZES.XL_STICKY,     // XL (Sticky): 360px - Nome do aluno (sticky)
  ATIVIDADE: TABLE_COLUMN_SIZES.L,         // L (Grande): 240px - Título + descrição
  ARQUIVO: TABLE_COLUMN_SIZES.M,           // M (Médio): 140px - Nome do arquivo
  PRAZO: TABLE_COLUMN_SIZES.M,             // M (Médio): 140px - Data de vencimento
  STATUS: TABLE_COLUMN_SIZES.S,            // S (Pequeno): 110px - Status badge
  ENTREGUE_EM: TABLE_COLUMN_SIZES.M,       // M (Médio): 140px - Data/hora
  AVALIAR: TABLE_COLUMN_SIZES.S,           // S (Pequeno): 110px - Botão avaliar
  ACOES: TABLE_COLUMN_SIZES.XS,            // XS (Mini): 90px - Ações
} as const;

export const TABLE_MIN_W = "1280px";

// Re-export para manter compatibilidade com imports existentes
export { COL as default };
