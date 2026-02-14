/**
 * Sanitização de HTML para prevenir XSS (Cross-Site Scripting)
 * Usa DOMPurify para limpar conteúdo HTML antes de renderizar
 */
import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML permitindo apenas tags seguras de formatação básica
 * Remove scripts, event handlers e outros vetores de XSS
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * Sanitiza texto puro (remove TODAS as tags HTML)
 * Use para campos que não devem conter formatação
 */
export function sanitizeText(dirty: string | null | undefined): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Escapa caracteres especiais HTML para exibição segura
 * Alternativa mais leve quando não precisa de DOMPurify
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}
