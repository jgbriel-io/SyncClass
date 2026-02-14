/**
 * Mapeia erros técnicos do banco de dados para mensagens amigáveis
 * 
 * Sprint 3: Validações no Banco
 * 
 * Este arquivo centraliza o tratamento de erros do Supabase/PostgreSQL,
 * convertendo códigos de erro técnicos em mensagens que o usuário entende.
 */

interface DatabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Mapeia um erro do banco de dados para uma mensagem amigável
 * 
 * @param error - Erro retornado pelo Supabase
 * @returns Mensagem amigável para exibir ao usuário
 */
export function mapDatabaseError(error: unknown): string {
  if (!error) {
    return 'Erro desconhecido';
  }

  const dbError = error as DatabaseError;
  const message = dbError.message || '';
  const code = dbError.code || '';

  // =====================================================
  // ERROS DE CONSTRAINT (23xxx)
  // =====================================================

  // 23514: CHECK constraint violation
  if (code === '23514') {
    if (message.includes('amount_positive')) {
      return 'O valor da cobrança deve ser maior que zero';
    }
    if (message.includes('hourly_rate_positive')) {
      return 'O valor por hora deve ser maior que zero';
    }
    if (message.includes('classes_per_week_positive')) {
      return 'O número de aulas por semana deve ser maior que zero';
    }
    if (message.includes('pay_day_valid')) {
      return 'O dia de pagamento deve estar entre 1 e 31';
    }
    if (message.includes('due_date_valid')) {
      return 'A data de vencimento não pode ser anterior à data de criação';
    }
    if (message.includes('paid_at_valid')) {
      return 'A data de pagamento não pode ser anterior à data de criação';
    }
    if (message.includes('status_valid')) {
      return 'Status inválido. Use: pendente, pago ou atrasado';
    }
    
    // Erro genérico de validação
    return 'Erro de validação: verifique os dados informados';
  }

  // 23505: UNIQUE constraint violation
  if (code === '23505') {
    if (message.includes('cpf')) {
      return 'Este CPF já está cadastrado no sistema';
    }
    if (message.includes('email')) {
      return 'Este email já está cadastrado no sistema';
    }
    
    return 'Este registro já existe no sistema';
  }

  // 23503: FOREIGN KEY constraint violation
  if (code === '23503') {
    if (message.includes('student_id')) {
      return 'Aluno não encontrado';
    }
    if (message.includes('teacher_id')) {
      return 'Professor não encontrado';
    }
    
    return 'Registro relacionado não encontrado';
  }

  // =====================================================
  // ERROS DE TRIGGER (P0001)
  // =====================================================

  // P0001: RAISE EXCEPTION (mensagens customizadas)
  if (code === 'P0001') {
    // Sobreposição de horários
    if (message.includes('já tem aula agendada')) {
      return message; // Já é amigável
    }
    
    // CPF duplicado
    if (message.includes('CPF') && message.includes('já está cadastrado')) {
      return message; // Já é amigável
    }
    
    // Status financeiro
    if (message.includes('status') && message.includes('paid_at')) {
      return message; // Já é amigável
    }
    
    // Horário inválido
    if (message.includes('Horário de término')) {
      return message; // Já é amigável
    }
    
    // Outras exceções customizadas
    return message;
  }

  // =====================================================
  // ERROS DE RPC
  // =====================================================

  // Erros de RPC (funções do banco)
  if (message.includes('Nenhuma aula no pacote')) {
    return 'É necessário adicionar pelo menos uma aula ao pacote';
  }
  
  if (message.includes('Todas as aulas do pacote devem ser do mesmo aluno')) {
    return 'Todas as aulas do pacote devem ser do mesmo aluno';
  }
  
  if (message.includes('Operação já está sendo processada')) {
    return 'Esta operação já está sendo processada. Aguarde alguns segundos.';
  }
  
  if (message.includes('Aluno não encontrado')) {
    return 'Aluno não encontrado';
  }
  
  if (message.includes('Registro financeiro não encontrado')) {
    return 'Registro financeiro não encontrado';
  }

  // =====================================================
  // ERROS DE PERMISSÃO (42xxx)
  // =====================================================

  // 42501: Insufficient privilege
  if (code === '42501') {
    return 'Você não tem permissão para realizar esta operação';
  }

  // 42P01: Undefined table
  if (code === '42P01') {
    return 'Erro de configuração do sistema. Contate o suporte.';
  }

  // =====================================================
  // ERROS DE CONEXÃO
  // =====================================================

  if (message.includes('Failed to fetch') || message.includes('Network')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  if (message.includes('timeout')) {
    return 'A operação demorou muito. Tente novamente.';
  }

  // =====================================================
  // ERRO GENÉRICO
  // =====================================================

  // Se chegou aqui, retornar mensagem original ou genérica
  if (message && message.length > 0 && message.length < 200) {
    return message;
  }

  return 'Erro ao processar operação. Tente novamente.';
}

/**
 * Verifica se um erro é de sobreposição de horários
 * 
 * @param error - Erro retornado pelo Supabase
 * @returns true se for erro de sobreposição
 */
export function isOverlapError(error: unknown): boolean {
  const dbError = error as DatabaseError;
  const message = dbError.message || '';
  
  return message.includes('já tem aula agendada') || 
         message.includes('sobrepõem') ||
         message.includes('overlap');
}

/**
 * Verifica se um erro é de validação (constraint)
 * 
 * @param error - Erro retornado pelo Supabase
 * @returns true se for erro de validação
 */
export function isValidationError(error: unknown): boolean {
  const dbError = error as DatabaseError;
  const code = dbError.code || '';
  
  return code === '23514' || // CHECK constraint
         code === '23505' || // UNIQUE constraint
         code === '23503';   // FOREIGN KEY constraint
}

/**
 * Verifica se um erro é de permissão
 * 
 * @param error - Erro retornado pelo Supabase
 * @returns true se for erro de permissão
 */
export function isPermissionError(error: unknown): boolean {
  const dbError = error as DatabaseError;
  const code = dbError.code || '';
  
  return code === '42501' || // Insufficient privilege
         code === 'PGRST301'; // JWT expired
}
