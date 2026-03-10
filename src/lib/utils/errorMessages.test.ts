/**
 * Testes para sanitização de mensagens de erro
 */
import { describe, it, expect } from 'vitest';
import { sanitizeErrorMessage, isNetworkError, isPermissionError } from './errorMessages';

describe('sanitizeErrorMessage', () => {
  it('deve sanitizar erro de duplicate key', () => {
    const error = new Error('duplicate key value violates unique constraint "students_phone_key"');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Este registro já existe no sistema');
    expect(message).not.toContain('students_phone_key');
  });

  it('deve sanitizar erro de not null', () => {
    const error = new Error('null value in column "name" violates not-null constraint');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Todos os campos obrigatórios devem ser preenchidos');
    expect(message).not.toContain('column');
  });

  it('deve sanitizar erro de foreign key', () => {
    const error = new Error('update or delete on table "students" violates foreign key constraint');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Não é possível realizar esta operação devido a dependências');
    expect(message).not.toContain('table');
  });

  it('deve sanitizar erro de permissão', () => {
    const error = new Error('permission denied for table financial_records');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Você não tem permissão para realizar esta ação');
    expect(message).not.toContain('financial_records');
  });

  it('deve sanitizar erro de rede', () => {
    const error = new Error('fetch failed: network error');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Erro de conexão. Verifique sua internet e tente novamente');
    expect(message).not.toContain('fetch');
  });

  it('deve sanitizar erro de timeout', () => {
    const error = new Error('request timed out after 30000ms');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('A operação demorou muito. Tente novamente');
    expect(message).not.toContain('30000ms');
  });

  it('deve retornar mensagem padrão para erro desconhecido', () => {
    const error = new Error('Some unknown database error');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Ocorreu um erro. Tente novamente');
  });

  it('deve preservar mensagens amigáveis curtas', () => {
    const error = 'Email é obrigatório';
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Email é obrigatório');
  });

  it('deve sanitizar mensagens com detalhes técnicos', () => {
    const error = 'Error in table students: column phone violates constraint';
    const message = sanitizeErrorMessage(error);
    expect(message).not.toContain('table');
    expect(message).not.toContain('column');
  });

  it('deve lidar com null', () => {
    const message = sanitizeErrorMessage(null);
    expect(message).toBe('Ocorreu um erro. Tente novamente');
  });

  it('deve lidar com undefined', () => {
    const message = sanitizeErrorMessage(undefined);
    expect(message).toBe('Ocorreu um erro. Tente novamente');
  });

  it('deve lidar com objetos de erro customizados', () => {
    const error = { message: 'duplicate key value' };
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Este registro já existe no sistema');
  });
});

describe('isNetworkError', () => {
  it('deve detectar erro de network', () => {
    const error = new Error('network error occurred');
    expect(isNetworkError(error)).toBe(true);
  });

  it('deve detectar erro de fetch failed', () => {
    const error = new Error('fetch failed');
    expect(isNetworkError(error)).toBe(true);
  });

  it('deve detectar erro de connection', () => {
    const error = new Error('connection refused');
    expect(isNetworkError(error)).toBe(true);
  });

  it('deve detectar erro de timeout', () => {
    const error = new Error('request timeout');
    expect(isNetworkError(error)).toBe(true);
  });

  it('deve retornar false para outros erros', () => {
    const error = new Error('validation error');
    expect(isNetworkError(error)).toBe(false);
  });
});

describe('isPermissionError', () => {
  it('deve detectar erro de permission denied', () => {
    const error = new Error('permission denied');
    expect(isPermissionError(error)).toBe(true);
  });

  it('deve detectar erro de unauthorized', () => {
    const error = new Error('unauthorized access');
    expect(isPermissionError(error)).toBe(true);
  });

  it('deve detectar erro de forbidden', () => {
    const error = new Error('403 forbidden');
    expect(isPermissionError(error)).toBe(true);
  });

  it('deve detectar erro de not authorized', () => {
    const error = new Error('user not authorized');
    expect(isPermissionError(error)).toBe(true);
  });

  it('deve retornar false para outros erros', () => {
    const error = new Error('validation error');
    expect(isPermissionError(error)).toBe(false);
  });
});

describe('Casos de uso reais', () => {
  it('deve sanitizar erro do Supabase', () => {
    const error = new Error('Error: duplicate key value violates unique constraint "students_email_key"\nDETAIL: Key (email)=(test@test.com) already exists.');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Este registro já existe no sistema');
    expect(message).not.toContain('DETAIL');
    expect(message).not.toContain('test@test.com');
  });

  it('deve sanitizar erro de RLS', () => {
    const error = new Error('new row violates row-level security policy for table "financial_records"');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Você não tem permissão para realizar esta ação');
    expect(message).not.toContain('row-level security');
  });

  it('deve sanitizar stack trace', () => {
    const error = new Error('Error at line 42 in file useFinancialRecords.ts: duplicate key');
    const message = sanitizeErrorMessage(error);
    expect(message).toBe('Este registro já existe no sistema');
    expect(message).not.toContain('line 42');
    expect(message).not.toContain('useFinancialRecords.ts');
  });
});
