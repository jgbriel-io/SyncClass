import { z } from "zod";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";

/** Schema de email reutilizável em todos os cadastros (usuários, professores, alunos). */
export const emailSchema = z
  .string()
  .min(1, "Email é obrigatório")
  .max(255, "Email muito longo")
  .email("Email inválido")
  .refine((v) => REGEX_PATTERNS.email.test(v.trim()), "Email inválido");

/** Normaliza email para envio (trim + lowercase). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
