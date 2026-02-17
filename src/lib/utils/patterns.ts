/**
 * Padrões de RegExp e máscaras centralizados
 * 
 * Este arquivo concentra todos os padrões de validação e formatação
 * usados no projeto, evitando duplicação e garantindo consistência.
 */

// ============================================================
// REGEX PATTERNS - Validação
// ============================================================

export const REGEX_PATTERNS = {
  // Documentos brasileiros
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cpfDigits: /\D/g, // Remove tudo que não é dígito
  
  // Telefones
  phone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  phoneDigits: /\D/g, // Remove tudo que não é dígito
  
  // Datas
  date: /^\d{2}\/\d{2}\/\d{4}$/,
  dateDigits: /\D/g, // Remove tudo que não é dígito
  
  // Horários
  time: /^([01]?\d|2[0-3]):([0-5]\d)$/,
  
  // Números e valores
  onlyDigits: /[^\d]/g, // Remove tudo que não é dígito
  leadingZeros: /^0+(?!$)/, // Remove zeros à esquerda, exceto se for apenas "0"
  nonNumeric: /[^.\d,]/g, // Remove tudo exceto dígitos, ponto e vírgula
  
  // Formatação
  commaDecimal: /,/g, // Vírgula (para substituir por ponto)
  dotDecimal: /\./g, // Ponto (para substituir por vírgula)
  
  // Limpeza de texto
  nonAlphanumeric: /[^A-Za-zÀ-ÿ0-9]/g, // Remove caracteres especiais
  specialChars: /:/g, // Remove caracteres especiais específicos (usado em IDs),

  // Email (formato válido para cadastro; alinhado ao Zod .email())
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ============================================================
// MASK FUNCTIONS - Formatação de entrada
// ============================================================

/**
 * Máscara para CPF no formato 000.000.000-00
 */
export function maskCPF(value: string): string {
  const digits = value.replace(REGEX_PATTERNS.cpfDigits, "").slice(0, 11);
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Máscara para telefone no formato (00) 00000-0000 ou (00) 0000-0000
 */
export function maskPhone(value: string): string {
  const digits = value.replace(REGEX_PATTERNS.phoneDigits, "").slice(0, 11);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Formato antigo: (00) 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  
  // Formato novo: (00) 00000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Máscara para data no formato dd/MM/yyyy
 */
export function maskDate(value: string): string {
  const digits = value.replace(REGEX_PATTERNS.dateDigits, "").slice(0, 8);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Máscara para valor monetário no formato R$ 1.234,56
 */
export function maskMoney(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(REGEX_PATTERNS.onlyDigits, "");
  
  if (!digits) return "";
  
  // Converte para número e formata
  const number = parseInt(digits, 10) / 100;
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

/**
 * Verifica se um valor contém asteriscos (dados sensíveis mascarados)
 */
export function isMasked(value: string | null | undefined): boolean {
  return typeof value === "string" && value.includes("*");
}

/**
 * Converte string dd/mm/yyyy para Date (meio-dia para evitar fuso).
 * Retorna undefined se a string for vazia ou não estiver no formato válido.
 */
export function brDateStringToDate(br: string): Date | undefined {
  if (!br || !REGEX_PATTERNS.date.test(br)) return undefined;
  const [day, month, year] = br.split("/");
  return new Date(`${year}-${month}-${day}T12:00:00`);
}

// ============================================================
// VALIDATION FUNCTIONS - Validação de dados
// ============================================================

/**
 * Valida se uma string de data está em formato válido e representa uma data real
 */
export function isValidDateString(value: string): boolean {
  if (!REGEX_PATTERNS.date.test(value)) return false;
  
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Valida formato de CPF (não valida dígitos verificadores)
 */
export function isValidCPFFormat(value: string): boolean {
  return REGEX_PATTERNS.cpf.test(value);
}

/**
 * Valida formato de telefone
 */
export function isValidPhoneFormat(value: string): boolean {
  return REGEX_PATTERNS.phone.test(value);
}

/**
 * Valida formato de email (uso em backend e validação extra no frontend)
 */
export function isValidEmailFormat(value: string): boolean {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length === 0 || trimmed.length > 255) return false;
  return REGEX_PATTERNS.email.test(trimmed);
}

// ============================================================
// PARSING FUNCTIONS - Conversão de dados
// ============================================================

/**
 * Converte string de valor monetário para número
 * Aceita formatos: "1.234,56" ou "1234.56" ou "1234,56"
 */
export function parseMoneyToNumber(value: string): number {
  // Remove tudo exceto dígitos, vírgula e ponto
  const cleaned = value.replace(/[^\d,.]/g, "");
  
  // Se tem vírgula e ponto, assume formato brasileiro (1.234,56)
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }
  
  // Se tem apenas vírgula, assume formato brasileiro (1234,56)
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(",", "."));
  }
  
  // Se tem apenas ponto ou nenhum, assume formato americano (1234.56)
  return parseFloat(cleaned);
}

/**
 * Formata número para string monetária brasileira com separador de milhar
 * Ex: 1234.56 -> "1.234,56"
 */
export function formatNumberToMoneyBR(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0,00";
  
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte número para string com vírgula decimal (sem separador de milhar)
 * Ex: 1234.56 -> "1234,56"
 * @deprecated Use formatNumberToMoneyBR para formato completo
 */
export function formatNumberToMoney(value: number): string {
  return String(value).replace(".", ",");
}

/**
 * Remove todos os não-dígitos de uma string
 */
export function extractDigits(value: string): string {
  return value.replace(REGEX_PATTERNS.onlyDigits, "");
}

/**
 * Remove zeros à esquerda, mantendo pelo menos um dígito
 */
export function removeLeadingZeros(value: string): string {
  return value.replace(REGEX_PATTERNS.leadingZeros, "");
}

/**
 * Extrai a primeira letra maiúscula de um nome (para avatar)
 */
export function getAvatarLetter(name: string): string {
  const cleaned = name.replace(REGEX_PATTERNS.nonAlphanumeric, "").charAt(0).toUpperCase();
  return cleaned || "?";
}

/**
 * Remove caracteres especiais de IDs (ex: usado no chartId)
 */
export function sanitizeId(id: string): string {
  return id.replace(REGEX_PATTERNS.specialChars, "");
}

// ============================================================
// EXPORT TYPE HELPERS
// ============================================================

export type RegexPattern = keyof typeof REGEX_PATTERNS;
