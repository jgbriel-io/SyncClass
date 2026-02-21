/**
 * Schemas Zod reutilizáveis para validação de formulários
 * Centraliza validações comuns (telefone, email, etc.)
 */

import { z } from "zod";
import { REGEX_PATTERNS, isValidDateString } from "@/lib/utils/patterns";

/**
 * Schema para telefone (formato: (00) 0000-0000 ou (00) 00000-0000)
 * Aceita vazio ou telefone válido
 */
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (v) =>
      !v ||
      ((v.length === 14 || v.length === 15) && REGEX_PATTERNS.phone.test(v)),
    { message: "Telefone inválido (formato: (00) 00000-0000)" }
  );

/**
 * Schema para telefone obrigatório
 */
export const phoneRequiredSchema = z
  .string()
  .min(1, "Telefone é obrigatório")
  .refine(
    (v) => (v.length === 14 || v.length === 15) && REGEX_PATTERNS.phone.test(v),
    { message: "Telefone inválido (formato: (00) 00000-0000)" }
  );

/**
 * Schema para email
 * Aceita vazio ou email válido
 */
export const emailSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || REGEX_PATTERNS.email.test(v),
    { message: "Email inválido" }
  );

/**
 * Schema para email obrigatório
 */
export const emailRequiredSchema = z
  .string()
  .min(1, "Email é obrigatório")
  .email("Email inválido");

/**
 * Schema para data no formato dd/mm/aaaa
 * Aceita vazio ou data válida
 */
export const dateSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || (REGEX_PATTERNS.date.test(v) && isValidDateString(v)),
    { message: "Data inválida (formato: dd/mm/aaaa)" }
  );

/**
 * Schema para data obrigatória
 */
export const dateRequiredSchema = z
  .string()
  .min(1, "Data é obrigatória")
  .refine(
    (v) => REGEX_PATTERNS.date.test(v) && isValidDateString(v),
    { message: "Data inválida (formato: dd/mm/aaaa)" }
  );

/**
 * Schema para CEP (formato: 00000-000)
 * Aceita vazio ou CEP válido
 */
const CEP_REGEX = /^\d{5}-\d{3}$/;

export const cepSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || (v.length === 9 && CEP_REGEX.test(v)),
    { message: "CEP inválido (formato: 00000-000)" }
  );

/**
 * Schema para CEP obrigatório
 */
export const cepRequiredSchema = z
  .string()
  .min(1, "CEP é obrigatório")
  .refine(
    (v) => v.length === 9 && CEP_REGEX.test(v),
    { message: "CEP inválido (formato: 00000-000)" }
  );

/**
 * Schema para valor monetário (formato: 0,00 ou 0.000,00)
 * Aceita vazio ou valor válido
 */
const MONEY_REGEX = /^\d{1,3}(\.\d{3})*(,\d{2})?$/;

export const moneySchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || MONEY_REGEX.test(v),
    { message: "Valor inválido (formato: 0,00)" }
  );

/**
 * Schema para valor monetário obrigatório
 */
export const moneyRequiredSchema = z
  .string()
  .min(1, "Valor é obrigatório")
  .refine(
    (v) => MONEY_REGEX.test(v),
    { message: "Valor inválido (formato: 0,00)" }
  );

/**
 * Schema para nome (mínimo 2 caracteres)
 */
export const nameSchema = z
  .string()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(100, "Nome deve ter no máximo 100 caracteres");

/**
 * Schema para nome opcional
 */
export const nameOptionalSchema = z
  .string()
  .max(100, "Nome deve ter no máximo 100 caracteres")
  .optional();

/**
 * Schema para observações/notas (máximo 1000 caracteres)
 */
export const observationsSchema = z
  .string()
  .max(1000, "Máximo 1000 caracteres")
  .optional();

/**
 * Schema para descrição (máximo 500 caracteres)
 */
export const descriptionSchema = z
  .string()
  .max(500, "Máximo 500 caracteres")
  .optional();

/**
 * Schema para horário (formato: HH:mm)
 */
const REGEX_TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const timeSchema = z
  .string()
  .optional()
  .refine(
    (v) => !v || REGEX_TIME.test(v),
    { message: "Formato inválido (HH:mm)" }
  );

/**
 * Schema para horário obrigatório
 */
export const timeRequiredSchema = z
  .string()
  .min(1, "Horário é obrigatório")
  .refine(
    (v) => REGEX_TIME.test(v),
    { message: "Formato inválido (HH:mm)" }
  );

/**
 * Schema para nota (0-10)
 */
export const gradeSchema = z
  .number({ invalid_type_error: "Informe a nota" })
  .min(0, "Nota mínima é 0")
  .max(10, "Nota máxima é 10")
  .optional()
  .nullable();

/**
 * Schema para URL
 */
export const urlSchema = z
  .string()
  .url("URL inválida")
  .optional();

/**
 * Schema para senha (mínimo 6 caracteres)
 */
export const passwordSchema = z
  .string()
  .min(6, "Senha deve ter pelo menos 6 caracteres");

/**
 * Schema para confirmação de senha
 */
export function passwordConfirmSchema(passwordField: string = "password") {
  return z
    .object({
      [passwordField]: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data[passwordField] === data.confirmPassword, {
      message: "As senhas não coincidem",
      path: ["confirmPassword"],
    });
}
