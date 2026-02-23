/**
 * Sanitização de mensagens de erro para prevenir exposição de detalhes técnicos
 * Remove stack traces, nomes de tabelas, constraints e outros detalhes internos
 */

/**
 * Mensagens genéricas para tipos comuns de erro
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Erros de banco de dados
  duplicate: "Este registro já existe no sistema",
  foreign_key: "Não é possível realizar esta operação devido a dependências",
  not_null: "Todos os campos obrigatórios devem ser preenchidos",
  check_violation: "Os dados fornecidos não atendem aos requisitos",
  unique_violation: "Este valor já está em uso",
  grade_range: "A nota deve estar entre 0 e 100",
  
  // Erros de autenticação
  invalid_credentials: "Email ou senha incorretos",
  email_not_confirmed: "Confirme seu email antes de fazer login",
  user_not_found: "Usuário não encontrado",
  session_expired: "Sua sessão expirou. Faça login novamente",
  
  // Erros de permissão
  permission_denied: "Você não tem permissão para realizar esta ação",
  unauthorized: "Acesso não autorizado",
  
  // Erros de rede
  network: "Erro de conexão. Verifique sua internet e tente novamente",
  timeout: "A operação demorou muito. Tente novamente",
  
  // Erros de validação
  validation: "Os dados fornecidos são inválidos",
  file_too_large: "O arquivo é muito grande",
  invalid_file_type: "Tipo de arquivo não permitido",
  
  // Erro genérico
  default: "Ocorreu um erro. Tente novamente",
};

/**
 * Detecta o tipo de erro baseado na mensagem
 */
function detectErrorType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Detectar constraint específico de notas
  if (lowerMessage.includes("grade_range") || lowerMessage.includes("nota deve estar")) {
    return "grade_range";
  }
  if (lowerMessage.includes("duplicate") || lowerMessage.includes("already exists") || lowerMessage.includes("já cadastrado")) {
    return "duplicate";
  }
  if (lowerMessage.includes("foreign key") || lowerMessage.includes("violates foreign key")) {
    return "foreign_key";
  }
  if (lowerMessage.includes("not null") || lowerMessage.includes("null value")) {
    return "not_null";
  }
  if (lowerMessage.includes("check constraint") || lowerMessage.includes("check violation")) {
    return "check_violation";
  }
  if (lowerMessage.includes("unique constraint") || lowerMessage.includes("unique violation")) {
    return "unique_violation";
  }
  if (lowerMessage.includes("invalid credentials") || lowerMessage.includes("invalid login")) {
    return "invalid_credentials";
  }
  if (lowerMessage.includes("email not confirmed")) {
    return "email_not_confirmed";
  }
  if (lowerMessage.includes("user not found")) {
    return "user_not_found";
  }
  if (lowerMessage.includes("session") && lowerMessage.includes("expired")) {
    return "session_expired";
  }
  if (lowerMessage.includes("permission denied") || lowerMessage.includes("insufficient privileges") || lowerMessage.includes("row-level security")) {
    return "permission_denied";
  }
  if (lowerMessage.includes("unauthorized") || lowerMessage.includes("not authorized")) {
    return "unauthorized";
  }
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch failed") || lowerMessage.includes("connection")) {
    return "network";
  }
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "timeout";
  }
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    return "validation";
  }
  if (lowerMessage.includes("file") && lowerMessage.includes("large")) {
    return "file_too_large";
  }
  if (lowerMessage.includes("file type") || lowerMessage.includes("invalid type")) {
    return "invalid_file_type";
  }
  
  return "default";
}

/**
 * Sanitiza mensagem de erro para exibição ao usuário
 * Remove detalhes técnicos e retorna mensagem amigável
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES.default;
  
  // Se já é uma mensagem amigável (não contém detalhes técnicos), retornar
  if (typeof error === "string") {
    const lowerError = error.toLowerCase();
    const hasTechnicalDetails = 
      lowerError.includes("table") ||
      lowerError.includes("column") ||
      lowerError.includes("constraint") ||
      lowerError.includes("relation") ||
      lowerError.includes("pg_") ||
      lowerError.includes("sql") ||
      lowerError.includes("stack trace") ||
      lowerError.includes("at ") ||
      lowerError.includes("error:");
    
    if (!hasTechnicalDetails && error.length < 200) {
      return error;
    }
  }
  
  // Extrair mensagem do objeto Error
  let message = "";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object" && error !== null && "message" in error) {
    message = String((error as { message: unknown }).message);
  } else {
    message = String(error);
  }
  
  // Detectar tipo e retornar mensagem genérica
  const errorType = detectErrorType(message);
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES.default;
}

/**
 * Verifica se um erro é de rede/conexão
 */
export function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("load failed")
  );
}

/**
 * Verifica se um erro é de permissão/autorização
 */
export function isPermissionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("forbidden") ||
    lowerMessage.includes("not authorized")
  );
}
