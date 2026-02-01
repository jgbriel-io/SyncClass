/**
 * Utilitários centralizados de formatação
 * 
 * Este arquivo contém todas as funções de formatação usadas no projeto.
 * NÃO duplique estas funções em outros arquivos.
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Parseia string YYYY-MM-DD como data local (evita bug de timezone UTC).
 * Para strings com hora (ISO), usa parse padrão.
 */
function parseDateLocal(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(value + "T12:00:00");
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(value);
}

/**
 * Formata uma data no formato brasileiro (dd/MM/yyyy)
 * @param dateString - String de data ISO (YYYY-MM-DD ou full) ou Date object
 * @returns String formatada (ex: "31/01/2026")
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? parseDateLocal(dateString) : dateString;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

/**
 * Formata uma data com hora no formato brasileiro
 * @param dateString - String de data ISO ou Date object
 * @returns String formatada (ex: "31/01/2026 às 14:30")
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? parseDateLocal(dateString) : dateString;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formata um CPF (000.000.000-00)
 * @param cpf - String com 11 dígitos
 * @returns String formatada (ex: "123.456.789-00")
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata um telefone brasileiro
 * @param phone - String com dígitos do telefone
 * @returns String formatada (ex: "(11) 98765-4321" ou "(11) 3456-7890")
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (cleaned.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  
  return phone;
}

/**
 * Formata uma porcentagem
 * @param value - Valor numérico (0-100)
 * @param decimals - Número de casas decimais (padrão: 0)
 * @returns String formatada (ex: "85%" ou "85.5%")
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata um nome abreviando o meio (mantém primeiro e último)
 * @param fullName - Nome completo
 * @returns Nome abreviado (ex: "João Silva" ou "João S. Costa")
 */
export function formatShortName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  
  if (parts.length <= 2) {
    return fullName;
  }
  
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  if (parts.length === 3) {
    return `${firstName} ${parts[1][0]}. ${lastName}`;
  }
  
  return `${firstName} ${lastName}`;
}
