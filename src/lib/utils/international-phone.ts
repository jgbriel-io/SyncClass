/**
 * Formatação genérica de telefone internacional
 * Formato: +XX (XXX) XXX-XXXX ou similar
 */

export function maskInternationalPhone(value: string): string {
  // Remove tudo exceto números e o símbolo +
  const cleaned = value.replace(/[^\d+]/g, '');
  
  // Se começar com +, mantém
  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\+/g, '');
  
  // Limitar a 15 dígitos (padrão internacional E.164)
  const limited = digits.slice(0, 15);
  
  if (limited.length === 0) return '';
  
  // Formatação genérica baseada no tamanho
  let formatted = '';
  
  if (hasPlus) {
    formatted = '+';
    
    // Código do país (1-3 dígitos)
    if (limited.length <= 3) {
      formatted += limited;
    } else if (limited.length <= 6) {
      // +XX XXX
      formatted += limited.slice(0, 2) + ' ' + limited.slice(2);
    } else if (limited.length <= 10) {
      // +XX XXX XXX
      formatted += limited.slice(0, 2) + ' ' + limited.slice(2, 5) + ' ' + limited.slice(5);
    } else {
      // +XX XXX XXX-XXXX
      formatted += limited.slice(0, 2) + ' ' + limited.slice(2, 5) + ' ' + limited.slice(5, 8) + '-' + limited.slice(8);
    }
  } else {
    // Sem +, formato simples com espaços
    if (limited.length <= 3) {
      formatted = limited;
    } else if (limited.length <= 6) {
      formatted = limited.slice(0, 3) + ' ' + limited.slice(3);
    } else if (limited.length <= 10) {
      formatted = limited.slice(0, 3) + ' ' + limited.slice(3, 6) + ' ' + limited.slice(6);
    } else {
      formatted = limited.slice(0, 3) + ' ' + limited.slice(3, 6) + ' ' + limited.slice(6, 10) + (limited.length > 10 ? '-' + limited.slice(10) : '');
    }
  }
  
  return formatted;
}

/**
 * Remove formatação do telefone internacional
 */
export function unmaskInternationalPhone(value: string): string {
  return value.replace(/[^\d+]/g, '');
}
