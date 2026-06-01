/**
 * Rate Limiting para prevenir spam de requisições
 * Implementação client-side simples (para produção, usar rate limiting no servidor)
 */

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

interface RateLimitState {
  calls: number[];
  blocked: boolean;
  blockedUntil: number;
}

const rateLimitStates = new Map<string, RateLimitState>();

/**
 * Verifica se uma operação pode ser executada baseado em rate limiting
 * @param key - Identificador único da operação (ex: "createFinancialRecord")
 * @param config - Configuração de rate limit
 * @returns true se permitido, false se bloqueado
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxCalls: 5, windowMs: 60000 } // 5 chamadas por minuto
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let state = rateLimitStates.get(key);

  if (!state) {
    state = { calls: [], blocked: false, blockedUntil: 0 };
    rateLimitStates.set(key, state);
  }

  // Se está bloqueado, verificar se já passou o tempo
  if (state.blocked && now < state.blockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((state.blockedUntil - now) / 1000),
    };
  }

  // Limpar bloqueio se já passou o tempo
  if (state.blocked && now >= state.blockedUntil) {
    state.blocked = false;
    state.calls = [];
  }

  // Remover chamadas antigas (fora da janela de tempo)
  state.calls = state.calls.filter(
    (timestamp) => now - timestamp < config.windowMs
  );

  // Verificar se excedeu o limite
  if (state.calls.length >= config.maxCalls) {
    state.blocked = true;
    state.blockedUntil = now + config.windowMs;
    return {
      allowed: false,
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }

  // Registrar nova chamada
  state.calls.push(now);
  return { allowed: true };
}

/**
 * Reseta o rate limit para uma chave específica
 * Útil para testes ou após logout
 */
export function resetRateLimit(key: string): void {
  rateLimitStates.delete(key);
}

/**
 * Reseta todos os rate limits
 * Útil após logout
 */
export function resetAllRateLimits(): void {
  rateLimitStates.clear();
}

/**
 * Hook React para rate limiting
 * Retorna função que verifica rate limit antes de executar callback
 */
export function useRateLimit(
  key: string,
  config?: RateLimitConfig
): (callback: () => void | Promise<void>) => Promise<void> {
  return async (callback: () => void | Promise<void>) => {
    const result = checkRateLimit(key, config);

    if (!result.allowed) {
      throw new Error(
        `Muitas requisições. Aguarde ${result.retryAfter} segundo(s) antes de tentar novamente.`
      );
    }

    await callback();
  };
}

/**
 * Configurações pré-definidas para diferentes tipos de operação
 */
export const RATE_LIMIT_CONFIGS = {
  // Operações críticas (criar/deletar)
  CRITICAL: { maxCalls: 3, windowMs: 60000 }, // 3 por minuto

  // Operações normais (update)
  NORMAL: { maxCalls: 10, windowMs: 60000 }, // 10 por minuto

  // Operações de leitura
  READ: { maxCalls: 30, windowMs: 60000 }, // 30 por minuto

  // Upload de arquivos
  UPLOAD: { maxCalls: 5, windowMs: 300000 }, // 5 por 5 minutos

  // Autenticação
  AUTH: { maxCalls: 5, windowMs: 300000 }, // 5 por 5 minutos
} as const;
