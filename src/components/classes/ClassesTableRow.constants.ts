import {
  TABLE_COLUMN_SIZES,
  calculateTableMinWidth,
} from "@/lib/design-tokens/table-columns";

// Mapeamento de colunas usando T-Shirt Sizes
export const COL = {
  ALUNO: TABLE_COLUMN_SIZES.XL, // XL (Sticky): 280px
  INFORMACOES: TABLE_COLUMN_SIZES.L, // L (Grande): 240px - Títulos/Descrições
  DATA: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Datas
  DURACAO: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Duração
  NOTA: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Nota/Status
  FINANCEIRO: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Status financeiro
  AVALIAR: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Botão avaliar
  ACOES: TABLE_COLUMN_SIZES.XS, // XS (Mini): 90px - Ações
} as const;

export const TABLE_MIN_W = calculateTableMinWidth([
  "XL",
  "L",
  "M",
  "S",
  "M",
  "M",
  "S",
  "XS",
]);
