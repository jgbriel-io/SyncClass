/**
 * Schemas Zod reutilizáveis para validação de formulários
 * Centraliza validações comuns (telefone, email, etc.)
 */

import { z } from "zod";
import { REGEX_PATTERNS, isValidDateString } from "@/lib/utils/patterns";
import { validation } from "@/content";

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
    { message: validation.phoneInvalid }
  );

/**
 * Schema para telefone obrigatório
 */
export const phoneRequiredSchema = z
  .string()
  .min(1, validation.phoneRequired)
  .refine(
    (v) => (v.length === 14 || v.length === 15) && REGEX_PATTERNS.phone.test(v),
    { message: validation.phoneInvalid }
  );

/**
 * Schema para email
 * Aceita vazio ou email válido
 */
export const emailSchema = z
  .string()
  .optional()
  .refine((v) => !v || REGEX_PATTERNS.email.test(v), {
    message: validation.emailInvalid,
  });

/**
 * Schema para email obrigatório
 */
export const emailRequiredSchema = z
  .string()
  .min(1, validation.emailRequired)
  .email(validation.emailInvalid);

/**
 * Schema para data no formato dd/mm/aaaa
 * Aceita vazio ou data válida
 */
export const dateSchema = z
  .string()
  .optional()
  .refine((v) => !v || (REGEX_PATTERNS.date.test(v) && isValidDateString(v)), {
    message: validation.dateInvalid,
  });

/**
 * Schema para data obrigatória
 */
export const dateRequiredSchema = z
  .string()
  .min(1, validation.dateRequired)
  .refine((v) => REGEX_PATTERNS.date.test(v) && isValidDateString(v), {
    message: validation.dateInvalid,
  });

/**
 * Schema para CEP (formato: 00000-000)
 * Aceita vazio ou CEP válido
 */
const CEP_REGEX = /^\d{5}-\d{3}$/;

export const cepSchema = z
  .string()
  .optional()
  .refine((v) => !v || (v.length === 9 && CEP_REGEX.test(v)), {
    message: validation.cepInvalid,
  });

/**
 * Schema para CEP obrigatório
 */
export const cepRequiredSchema = z
  .string()
  .min(1, validation.cepRequired)
  .refine((v) => v.length === 9 && CEP_REGEX.test(v), {
    message: validation.cepInvalid,
  });

/**
 * Schema para valor monetário (formato: 0,00 ou 0.000,00)
 * Aceita vazio ou valor válido
 */
const MONEY_REGEX = /^\d{1,3}(\.\d{3})*(,\d{2})?$/;

export const moneySchema = z
  .string()
  .optional()
  .refine((v) => !v || MONEY_REGEX.test(v), {
    message: validation.amountInvalid,
  });

/**
 * Schema para valor monetário obrigatório
 */
export const moneyRequiredSchema = z
  .string()
  .min(1, validation.amountRequired)
  .refine((v) => MONEY_REGEX.test(v), { message: validation.amountInvalid });

/**
 * Schema para nome (mínimo 2 caracteres)
 */
export const nameSchema = z
  .string()
  .min(2, validation.nameMin)
  .max(100, validation.nameMax);

/**
 * Schema para nome opcional
 */
export const nameOptionalSchema = z
  .string()
  .max(100, validation.nameMax)
  .optional();

/**
 * Schema para observações/notas (máximo 1000 caracteres)
 */
export const observationsSchema = z
  .string()
  .max(1000, validation.observationsMax)
  .optional();

/**
 * Schema para descrição (máximo 500 caracteres)
 */
export const descriptionSchema = z
  .string()
  .max(500, validation.descriptionMax)
  .optional();

/**
 * Schema para horário (formato: HH:mm)
 */
const REGEX_TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const timeSchema = z
  .string()
  .optional()
  .refine((v) => !v || REGEX_TIME.test(v), { message: validation.timeInvalid });

/**
 * Schema para horário obrigatório
 */
export const timeRequiredSchema = z
  .string()
  .min(1, validation.timeRequired)
  .refine((v) => REGEX_TIME.test(v), { message: validation.timeInvalid });

/**
 * Schema para nota (0-10)
 */
export const gradeSchema = z
  .number({ invalid_type_error: validation.gradeInvalid })
  .min(0, validation.gradeMin)
  .max(10, validation.gradeMax)
  .optional()
  .nullable();

/**
 * Schema para URL
 */
export const urlSchema = z.string().url(validation.urlInvalid).optional();

/**
 * Schema para senha (mínimo 6 caracteres)
 */
export const passwordSchema = z.string().min(6, validation.passwordMin);

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
      message: validation.passwordMismatch,
      path: ["confirmPassword"],
    });
}
