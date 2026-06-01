import { TABLE_COLUMN_SIZES } from "@/lib/design-tokens/table-columns";

export const COL = {
  STATUS_BADGE: "1%", // Badge de status (width: 1%)
  ALUNO: TABLE_COLUMN_SIZES.XL_STICKY, // XL (Sticky): 360px - Nome do aluno (sticky)
  TIPO: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Tipo de cobrança
  VALOR: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Valor
  VENCIMENTO: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Datas
  STATUS: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Status badge
  AVALIAR: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Confirmar/Desfazer
  ACOES: TABLE_COLUMN_SIZES.XS, // XS (Mini): 90px - Ações
} as const;

export const TABLE_MIN_W = "1280px";

// Re-export para manter compatibilidade com imports existentes
export { COL as default };
