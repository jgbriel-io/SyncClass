import { z } from "zod";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";

/**
 * Domínios permitidos para cadastro (apenas provedores reais).
 * Para aceitar email corporativo (ex: @escola.com.br), adicione o domínio aqui.
 */
export const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.com.br",
  "live.com",
  "live.com.br",
  "outlook.com.br",
  "outlook.pt",
  "msn.com",
  "yahoo.com",
  "yahoo.com.br",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
  "ig.com.br",
  "aol.com",
  "zoho.com",
  "mail.com",
  "i.ua",
  "inbox.com",
] as const;

function getEmailDomain(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const i = trimmed.lastIndexOf("@");
  return i >= 0 ? trimmed.slice(i + 1) : "";
}

/** Retorna true se o domínio do email está na lista de permitidos. */
export function isAllowedEmailDomain(email: string): boolean {
  const domain = getEmailDomain(email);
  return domain.length > 0 && ALLOWED_EMAIL_DOMAINS.includes(domain as (typeof ALLOWED_EMAIL_DOMAINS)[number]);
}

/** Schema de email: formato válido + domínio permitido (Gmail, Outlook, etc.). */
export const emailSchema = z
  .string()
  .min(1, "Email é obrigatório")
  .max(255, "Email muito longo")
  .email("Email inválido")
  .refine((v) => REGEX_PATTERNS.email.test(v.trim()), "Email inválido")
  .refine((v) => isAllowedEmailDomain(v), "Use um email de provedor real (Gmail, Outlook, Yahoo, etc.)");

/** Normaliza email para envio (trim + lowercase). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
