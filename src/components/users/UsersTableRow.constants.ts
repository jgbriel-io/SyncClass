import { TABLE_COLUMN_SIZES } from "@/lib/design-tokens/table-columns";

export const COL = {
  STATUS_BADGE: "1%", // Badge de status (width: 1%)
  USUARIO: TABLE_COLUMN_SIZES.XL_STICKY, // XL (Sticky): 360px - Nome/email do usuário (sticky)
  PRIVILEGIO: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Badge de privilégio
  VINCULO: TABLE_COLUMN_SIZES.L, // L (Grande): 240px - Vínculo com aluno/professor
  CADASTRO: TABLE_COLUMN_SIZES.M, // M (Médio): 140px - Data de cadastro
  PLACEHOLDER: TABLE_COLUMN_SIZES.S, // S (Pequeno): 110px - Coluna vazia
  ACOES: TABLE_COLUMN_SIZES.XS, // XS (Mini): 90px - Ações
} as const;

export const TABLE_MIN_W = "1280px";

// Re-export para manter compatibilidade com imports existentes
export { COL as default };
