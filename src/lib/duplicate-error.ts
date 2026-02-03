/**
 * Traduz erros de violação de unicidade (Postgres 23505) ou trigger platform-wide para mensagens amigáveis
 */
import { MSG_CPF_PLATFORM, MSG_PHONE_PLATFORM, MSG_EMAIL } from "./duplicate-messages";

export function getDuplicateErrorMessage(error: { code?: string; message?: string } | null): string | null {
  if (!error?.message) return null;
  const msg = error.message;
  // Mensagens do trigger platform-wide (qualquer código)
  if (msg.includes(MSG_CPF_PLATFORM)) return MSG_CPF_PLATFORM;
  if (msg.includes(MSG_PHONE_PLATFORM)) return MSG_PHONE_PLATFORM;
  if (error.code !== "23505") return null;

  if (msg.includes("teachers_unique_cpf") || msg.includes("students_unique_cpf")) {
    return MSG_CPF_PLATFORM;
  }
  if (msg.includes("teachers_unique_phone") || msg.includes("students_unique_phone")) {
    return MSG_PHONE_PLATFORM;
  }
  if (msg.includes("students_unique_email")) {
    return MSG_EMAIL;
  }

  return null;
}
