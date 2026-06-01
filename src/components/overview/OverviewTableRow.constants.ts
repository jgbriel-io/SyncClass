import {
  TABLE_COLUMN_SIZES,
  calculateTableMinWidth,
} from "@/lib/design-tokens/table-columns";

// Mapeamento de colunas usando T-Shirt Sizes
export const COL = {
  ALUNO: TABLE_COLUMN_SIZES.XL, // XL (Sticky): 280px
  ENTRADA: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Datas
  AULAS: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Contadores
  FREQUENCIA: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Status com badge
  MEDIA: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Notas
  PAGO: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Moedas
  PENDENTE: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Moedas
  ATRASADO: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Moedas
  ACOES: TABLE_COLUMN_SIZES.XS, // XS (Mini): 90px - Ações
} as const;

export const TABLE_MIN_W = calculateTableMinWidth([
  "XL",
  "M",
  "S",
  "M",
  "S",
  "S",
  "S",
  "S",
  "XS",
]);
