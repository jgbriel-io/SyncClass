/**
 * Error Handler - Sanitização de mensagens de erro
 * Previne exposição de estrutura do banco de dados (VULN-017)
 *
 * @module security/errorHandler
 */

/**
 * Sanitiza mensagens de erro técnicas para mensagens amigáveis
 * Remove informações sensíveis sobre estrutura do banco
 */
export function sanitizeErrorMessage(error: Error | unknown): string {
  if (!error) return "Erro desconhecido";

  const message = (error as Error).message?.toLowerCase() || "";

  // Erros de duplicação (unique constraints)
  if (
    message.includes("duplicate key") ||
    message.includes("unique constraint")
  ) {
    if (message.includes("email")) return "Este email já está cadastrado";
    if (message.includes("phone")) return "Este telefone já está cadastrado";
    if (message.includes("pix")) return "Esta chave PIX já está em uso";
    return "Registro duplicado. Verifique os dados";
  }

  // Erros de chave estrangeira (foreign key)
  if (message.includes("foreign key") || message.includes("violates")) {
    return "Operação inválida. Verifique os dados e tente novamente";
  }

  // Erros de permissão
  if (
    message.includes("permission denied") ||
    message.includes("insufficient_privilege") ||
    message.includes("policy")
  ) {
    return "Você não tem permissão para realizar esta ação";
  }

  // Erros de validação de dados
  if (
    message.includes("invalid input syntax") ||
    message.includes("check constraint") ||
    message.includes("violates check")
  ) {
    if (message.includes("email")) return "Email inválido";
    if (message.includes("phone")) return "Telefone inválido";
    if (message.includes("name")) return "Nome inválido";
    if (message.includes("grade")) return "Nota deve estar entre 0 e 100";
    if (message.includes("amount")) return "Valor inválido";
    if (message.includes("pix")) return "Chave PIX inválida";
    return "Dados inválidos. Verifique o formulário";
  }

  // Erros de conexão/timeout
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connection")
  ) {
    return "Erro de conexão. Verifique sua internet";
  }

  // Erros de autenticação
  if (
    message.includes("invalid credentials") ||
    message.includes("authentication") ||
    message.includes("unauthorized")
  ) {
    return "Credenciais inválidas";
  }

  // Erro genérico para outros casos
  return "Erro ao processar solicitação. Tente novamente";
}

export function logError(
  error: Error | unknown,
  context?: Record<string, unknown>
) {
  if (import.meta.env.DEV) {
    console.error("[Error]", error, context);
  }
}

/**
 * Handler padrão para erros de mutation
 * Usa sanitização + logging
 */
export function createErrorHandler(context: string) {
  return (error: Error | unknown) => {
    // Log completo (não visível ao usuário)
    logError(error, { context });

    // Retorna mensagem sanitizada
    return sanitizeErrorMessage(error);
  };
}
