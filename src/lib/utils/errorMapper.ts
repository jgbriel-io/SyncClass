/**
 * Mapeia erros do Postgres para mensagens amigáveis ao usuário
 * 
 * Códigos de erro PostgreSQL:
 * - 23514: CHECK constraint violation
 * - 23505: UNIQUE constraint violation
 * - 23503: FOREIGN KEY constraint violation
 * - 42501: Insufficient privilege (RLS)
 * - 23P01: Exclusion constraint violation (sobreposição)
 */

interface PostgresError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export function mapPostgresError(error: unknown): string {
  const pgError = error as PostgresError;
  const message = pgError?.message || "";
  const code = pgError?.code;

  // ========================================
  // CHECK CONSTRAINTS (23514)
  // ========================================
  if (code === "23514") {
    // Students constraints
    if (message.includes("students_hourly_rate_positive")) {
      return "O valor por hora deve ser maior que zero.";
    }
    if (message.includes("students_pay_day_valid")) {
      return "O dia de pagamento deve estar entre 1 e 31.";
    }
    if (message.includes("students_classes_per_week_valid")) {
      return "O número de aulas por semana deve estar entre 1 e 14.";
    }

    // Financial records constraints
    if (message.includes("financial_records_amount_positive")) {
      return "O valor da cobrança deve ser maior que zero.";
    }
    if (message.includes("financial_records_status_check")) {
      return "Status de cobrança inválido. Use: pendente, pago, atrasado, abonado, extornado ou cancelado.";
    }

    // Class logs constraints
    if (message.includes("class_logs_grade_range")) {
      return "A nota deve estar entre 0 e 10.";
    }

    // Generic check constraint
    return "Os dados fornecidos não atendem aos requisitos do sistema. Verifique os valores e tente novamente.";
  }

  // ========================================
  // UNIQUE CONSTRAINTS (23505)
  // ========================================
  if (code === "23505") {
    if (message.includes("students_email_key") || message.includes("email")) {
      return "Este e-mail já está cadastrado no sistema.";
    }
    if (message.includes("students_phone_key") || message.includes("phone")) {
      return "Este telefone já está cadastrado no sistema.";
    }
    if (message.includes("teachers_email_key")) {
      return "Este e-mail de professor já está cadastrado no sistema.";
    }
    if (message.includes("idempotency_key")) {
      return "Esta operação já foi processada anteriormente.";
    }
    return "Já existe um registro com estes dados no sistema.";
  }

  // ========================================
  // FOREIGN KEY CONSTRAINTS (23503)
  // ========================================
  if (code === "23503") {
    if (message.includes("teacher_id")) {
      return "Professor não encontrado. Verifique se o professor está ativo no sistema.";
    }
    if (message.includes("student_id")) {
      return "Aluno não encontrado. Verifique se o aluno está ativo no sistema.";
    }
    if (message.includes("class_log_id")) {
      return "Aula não encontrada. Verifique se a aula existe no sistema.";
    }
    if (message.includes("user_id")) {
      return "Usuário não encontrado. Verifique se o usuário está ativo.";
    }
    return "Referência inválida. Verifique se os dados relacionados existem no sistema.";
  }

  // ========================================
  // RLS - ROW LEVEL SECURITY (42501)
  // ========================================
  if (code === "42501" || message.includes("permission denied") || message.includes("insufficient privilege")) {
    if (message.includes("students")) {
      return "Você não tem permissão para acessar dados deste aluno.";
    }
    if (message.includes("financial_records")) {
      return "Você não tem permissão para acessar dados financeiros deste registro.";
    }
    if (message.includes("class_logs")) {
      return "Você não tem permissão para acessar dados desta aula.";
    }
    return "Você não tem permissão para realizar esta operação. Entre em contato com o administrador.";
  }

  // ========================================
  // EXCLUSION CONSTRAINTS (23P01) - Sobreposição de Aulas
  // ========================================
  if (
    code === "23P01" ||
    message.includes("neste horário") ||
    message.includes("sobreposição") ||
    message.includes("sobrepõem") ||
    message.includes("overlap") ||
    message.includes("class_logs_no_overlap") ||
    message.includes("exclusion constraint") ||
    message.includes("conflicting key") ||
    message.includes("agendada em")
  ) {
    return "Já existe outra aula neste horário para este professor. Escolha outro intervalo de tempo.";
  }

  // ========================================
  // NOT NULL CONSTRAINTS (23502)
  // ========================================
  if (code === "23502") {
    if (message.includes("name")) {
      return "O nome é obrigatório.";
    }
    if (message.includes("email")) {
      return "O e-mail é obrigatório.";
    }
    if (message.includes("student_id")) {
      return "O aluno é obrigatório.";
    }
    if (message.includes("teacher_id")) {
      return "O professor é obrigatório.";
    }
    if (message.includes("amount")) {
      return "O valor é obrigatório.";
    }
    if (message.includes("due_date")) {
      return "A data de vencimento é obrigatória.";
    }
    return "Um campo obrigatório não foi preenchido. Verifique o formulário.";
  }

  // ========================================
  // INVALID TEXT REPRESENTATION (22P02)
  // ========================================
  if (code === "22P02") {
    if (message.includes("uuid")) {
      return "Identificador inválido. Tente recarregar a página.";
    }
    if (message.includes("numeric") || message.includes("integer")) {
      return "Valor numérico inválido. Use apenas números.";
    }
    if (message.includes("date") || message.includes("timestamp")) {
      return "Data inválida. Use o formato DD/MM/AAAA.";
    }
    return "Formato de dado inválido. Verifique os valores informados.";
  }

  // ========================================
  // NUMERIC VALUE OUT OF RANGE (22003)
  // ========================================
  if (code === "22003") {
    return "Valor numérico fora do intervalo permitido. Use valores menores.";
  }

  // ========================================
  // STRING DATA RIGHT TRUNCATION (22001)
  // ========================================
  if (code === "22001") {
    return "Texto muito longo. Reduza o tamanho do campo.";
  }

  // ========================================
  // DIVISION BY ZERO (22012)
  // ========================================
  if (code === "22012") {
    return "Erro de cálculo: divisão por zero. Verifique os valores informados.";
  }

  // ========================================
  // UNDEFINED FUNCTION (42883)
  // ========================================
  if (code === "42883") {
    return "Função do banco de dados não encontrada. Entre em contato com o suporte técnico.";
  }

  // ========================================
  // UNDEFINED TABLE (42P01)
  // ========================================
  if (code === "42P01") {
    return "Tabela não encontrada no banco de dados. Entre em contato com o suporte técnico.";
  }

  // ========================================
  // ERROS DE REDE E CONEXÃO
  // ========================================
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT")
  ) {
    return "Erro de conexão com o servidor. Verifique sua internet e tente novamente.";
  }

  // ========================================
  // ERROS DE AUTENTICAÇÃO
  // ========================================
  if (
    message.includes("JWT") ||
    message.includes("token") ||
    message.includes("authentication") ||
    message.includes("unauthorized")
  ) {
    return "Sessão expirada. Faça login novamente.";
  }

  // ========================================
  // ERRO GENÉRICO
  // ========================================
  // Se chegou aqui, não conseguimos mapear o erro específico
  // Retornar mensagem genérica mas útil
  if (message && message.length > 0 && message.length < 200) {
    // Se a mensagem é curta e legível, retornar ela
    return `Erro: ${message}`;
  }

  return "Erro ao processar operação. Verifique os dados e tente novamente.";
}

/**
 * Verifica se um erro é de constraint do banco
 */
export function isConstraintError(error: unknown): boolean {
  const pgError = error as PostgresError;
  const code = pgError?.code;
  return code === "23514" || code === "23505" || code === "23503" || code === "23502";
}

/**
 * Verifica se um erro é de permissão (RLS)
 */
export function isPermissionError(error: unknown): boolean {
  const pgError = error as PostgresError;
  const code = pgError?.code;
  const message = pgError?.message || "";
  return code === "42501" || message.includes("permission denied");
}

/**
 * Verifica se um erro é de sobreposição de aulas
 */
export function isOverlapError(error: unknown): boolean {
  const pgError = error as PostgresError;
  const code = pgError?.code;
  const message = pgError?.message || "";
  return (
    code === "23P01" ||
    message.includes("neste horário") ||
    message.includes("sobreposição") ||
    message.includes("overlap")
  );
}
