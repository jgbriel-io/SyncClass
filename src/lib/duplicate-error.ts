/**
 * Traduz erros de violação de unicidade (Postgres 23505) para mensagens amigáveis
 */
export function getDuplicateErrorMessage(error: { code?: string; message?: string } | null): string | null {
  if (!error?.message || error.code !== "23505") return null;
  const msg = error.message;

  if (msg.includes("teachers_unique_cpf") || msg.includes("students_unique_cpf")) {
    return "CPF já cadastrado";
  }
  if (msg.includes("teachers_unique_phone") || msg.includes("students_unique_phone")) {
    return "Telefone já cadastrado";
  }
  if (msg.includes("students_unique_email")) {
    return "Email já cadastrado";
  }

  return null;
}
