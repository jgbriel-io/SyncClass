const ERROR_MESSAGES: Record<string, string> = {
  duplicate: "Este registro já existe no sistema",
  foreign_key: "Não é possível realizar esta operação devido a dependências",
  not_null: "Todos os campos obrigatórios devem ser preenchidos",
  check_violation: "Os dados fornecidos não atendem aos requisitos",
  unique_violation: "Este valor já está em uso",
  grade_range: "A nota deve estar entre 0 e 100",
  invalid_credentials: "Email ou senha incorretos",
  email_not_confirmed: "Confirme seu email antes de fazer login",
  user_not_found: "Usuário não encontrado",
  session_expired: "Sua sessão expirou. Faça login novamente",
  permission_denied: "Você não tem permissão para realizar esta ação",
  unauthorized: "Acesso não autorizado",
  network: "Erro de conexão. Verifique sua internet e tente novamente",
  timeout: "A operação demorou muito. Tente novamente",
  validation: "Os dados fornecidos são inválidos",
  file_too_large: "O arquivo é muito grande",
  invalid_file_type: "Tipo de arquivo não permitido",
  default: "Ocorreu um erro. Tente novamente",
};

function detectErrorType(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("grade_range") || m.includes("nota deve estar"))
    return "grade_range";
  if (
    m.includes("duplicate") ||
    m.includes("already exists") ||
    m.includes("já cadastrado")
  )
    return "duplicate";
  if (m.includes("foreign key") || m.includes("violates foreign key"))
    return "foreign_key";
  if (m.includes("not null") || m.includes("null value")) return "not_null";
  if (m.includes("check constraint") || m.includes("check violation"))
    return "check_violation";
  if (m.includes("unique constraint") || m.includes("unique violation"))
    return "unique_violation";
  if (m.includes("invalid credentials") || m.includes("invalid login"))
    return "invalid_credentials";
  if (m.includes("email not confirmed")) return "email_not_confirmed";
  if (m.includes("user not found")) return "user_not_found";
  if (m.includes("session") && m.includes("expired")) return "session_expired";
  if (
    m.includes("permission denied") ||
    m.includes("insufficient privileges") ||
    m.includes("row-level security")
  )
    return "permission_denied";
  if (m.includes("unauthorized") || m.includes("not authorized"))
    return "unauthorized";
  if (
    m.includes("network") ||
    m.includes("fetch failed") ||
    m.includes("connection")
  )
    return "network";
  if (m.includes("timeout") || m.includes("timed out")) return "timeout";
  if (m.includes("validation") || m.includes("invalid")) return "validation";
  if (m.includes("file") && m.includes("large")) return "file_too_large";
  if (m.includes("file type") || m.includes("invalid type"))
    return "invalid_file_type";
  return "default";
}

export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES.default;

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
    if (!hasTechnicalDetails && error.length < 200) return error;
  }

  let message = "";
  if (error instanceof Error) {
    message = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    message = String((error as { message: unknown }).message);
  } else {
    message = String(error);
  }

  return ERROR_MESSAGES[detectErrorType(message)] ?? ERROR_MESSAGES.default;
}

export function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const m = message.toLowerCase();
  return (
    m.includes("network") ||
    m.includes("fetch failed") ||
    m.includes("connection") ||
    m.includes("timeout") ||
    m.includes("load failed")
  );
}

export function isPermissionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const m = message.toLowerCase();
  return (
    m.includes("permission") ||
    m.includes("unauthorized") ||
    m.includes("forbidden") ||
    m.includes("not authorized")
  );
}

export function logError(
  error: Error | unknown,
  context?: Record<string, unknown>
) {
  if (import.meta.env.DEV) {
    console.error("[Error]", error, context);
  }
}

export function createErrorHandler(context: string) {
  return (error: Error | unknown) => {
    logError(error, { context });
    return sanitizeErrorMessage(error);
  };
}
