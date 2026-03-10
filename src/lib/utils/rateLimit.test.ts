import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, resetRateLimit, resetAllRateLimits, RATE_LIMIT_CONFIGS } from "./rateLimit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    resetAllRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("deve permitir chamadas dentro do limite", () => {
      const result1 = checkRateLimit("test", { maxCalls: 3, windowMs: 60000 });
      expect(result1.allowed).toBe(true);
      expect(result1.retryAfter).toBeUndefined();

      const result2 = checkRateLimit("test", { maxCalls: 3, windowMs: 60000 });
      expect(result2.allowed).toBe(true);

      const result3 = checkRateLimit("test", { maxCalls: 3, windowMs: 60000 });
      expect(result3.allowed).toBe(true);
    });

    it("deve bloquear chamadas que excedem o limite", () => {
      const config = { maxCalls: 3, windowMs: 60000 };

      // 3 chamadas permitidas
      checkRateLimit("test", config);
      checkRateLimit("test", config);
      checkRateLimit("test", config);

      // 4ª chamada bloqueada
      const result = checkRateLimit("test", config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("deve resetar após a janela de tempo", () => {
      const config = { maxCalls: 2, windowMs: 1000 };

      // 2 chamadas permitidas
      checkRateLimit("test", config);
      checkRateLimit("test", config);

      // 3ª chamada bloqueada
      const blocked = checkRateLimit("test", config);
      expect(blocked.allowed).toBe(false);

      // Avançar tempo além da janela
      vi.advanceTimersByTime(1100);

      // Deve permitir novamente
      const allowed = checkRateLimit("test", config);
      expect(allowed.allowed).toBe(true);
    });

    it("deve ter limites independentes por chave", () => {
      const config = { maxCalls: 2, windowMs: 60000 };

      // Esgotar limite da chave "test1"
      checkRateLimit("test1", config);
      checkRateLimit("test1", config);
      const blocked1 = checkRateLimit("test1", config);
      expect(blocked1.allowed).toBe(false);

      // Chave "test2" ainda deve permitir
      const allowed2 = checkRateLimit("test2", config);
      expect(allowed2.allowed).toBe(true);
    });

    it("deve retornar tempo correto de retry", () => {
      const config = { maxCalls: 1, windowMs: 5000 };

      checkRateLimit("test", config);
      const blocked = checkRateLimit("test", config);

      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBeGreaterThanOrEqual(4);
      expect(blocked.retryAfter).toBeLessThanOrEqual(5);
    });
  });

  describe("resetRateLimit", () => {
    it("deve resetar limite de uma chave específica", () => {
      const config = { maxCalls: 1, windowMs: 60000 };

      // Esgotar limite
      checkRateLimit("test", config);
      const blocked = checkRateLimit("test", config);
      expect(blocked.allowed).toBe(false);

      // Resetar
      resetRateLimit("test");

      // Deve permitir novamente
      const allowed = checkRateLimit("test", config);
      expect(allowed.allowed).toBe(true);
    });

    it("não deve afetar outras chaves", () => {
      const config = { maxCalls: 1, windowMs: 60000 };

      // Esgotar ambas as chaves
      checkRateLimit("test1", config);
      checkRateLimit("test1", config);
      checkRateLimit("test2", config);
      checkRateLimit("test2", config);

      // Resetar apenas test1
      resetRateLimit("test1");

      // test1 deve permitir, test2 ainda bloqueado
      const allowed1 = checkRateLimit("test1", config);
      const blocked2 = checkRateLimit("test2", config);

      expect(allowed1.allowed).toBe(true);
      expect(blocked2.allowed).toBe(false);
    });
  });

  describe("resetAllRateLimits", () => {
    it("deve resetar todos os limites", () => {
      const config = { maxCalls: 1, windowMs: 60000 };

      // Esgotar múltiplas chaves
      checkRateLimit("test1", config);
      checkRateLimit("test1", config);
      checkRateLimit("test2", config);
      checkRateLimit("test2", config);
      checkRateLimit("test3", config);
      checkRateLimit("test3", config);

      // Resetar tudo
      resetAllRateLimits();

      // Todas devem permitir novamente
      expect(checkRateLimit("test1", config).allowed).toBe(true);
      expect(checkRateLimit("test2", config).allowed).toBe(true);
      expect(checkRateLimit("test3", config).allowed).toBe(true);
    });
  });

  describe("RATE_LIMIT_CONFIGS", () => {
    it("deve ter configuração CRITICAL", () => {
      expect(RATE_LIMIT_CONFIGS.CRITICAL).toEqual({
        maxCalls: 3,
        windowMs: 60000,
      });
    });

    it("deve ter configuração NORMAL", () => {
      expect(RATE_LIMIT_CONFIGS.NORMAL).toEqual({
        maxCalls: 10,
        windowMs: 60000,
      });
    });

    it("deve ter configuração READ", () => {
      expect(RATE_LIMIT_CONFIGS.READ).toEqual({
        maxCalls: 30,
        windowMs: 60000,
      });
    });

    it("deve ter configuração UPLOAD", () => {
      expect(RATE_LIMIT_CONFIGS.UPLOAD).toEqual({
        maxCalls: 5,
        windowMs: 300000,
      });
    });

    it("deve ter configuração AUTH", () => {
      expect(RATE_LIMIT_CONFIGS.AUTH).toEqual({
        maxCalls: 5,
        windowMs: 300000,
      });
    });
  });

  describe("Cenários de uso real", () => {
    it("deve prevenir spam de criação de registros financeiros", () => {
      // Simular tentativa de criar 10 registros rapidamente
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(checkRateLimit("createFinancialRecord", RATE_LIMIT_CONFIGS.CRITICAL));
      }

      // Primeiros 3 permitidos, resto bloqueado
      expect(results.slice(0, 3).every((r) => r.allowed)).toBe(true);
      expect(results.slice(3).every((r) => !r.allowed)).toBe(true);
    });

    it("deve prevenir spam de uploads", () => {
      // Simular tentativa de fazer 10 uploads rapidamente
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(checkRateLimit("uploadAvatar", RATE_LIMIT_CONFIGS.UPLOAD));
      }

      // Primeiros 5 permitidos, resto bloqueado
      expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);
      expect(results.slice(5).every((r) => !r.allowed)).toBe(true);
    });

    it("deve permitir operações normais após aguardar", () => {
      const config = RATE_LIMIT_CONFIGS.CRITICAL;

      // Esgotar limite
      checkRateLimit("test", config);
      checkRateLimit("test", config);
      checkRateLimit("test", config);

      // Bloqueado
      expect(checkRateLimit("test", config).allowed).toBe(false);

      // Avançar 1 minuto
      vi.advanceTimersByTime(60000);

      // Deve permitir novamente
      expect(checkRateLimit("test", config).allowed).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("deve lidar com chamadas simultâneas", () => {
      const config = { maxCalls: 5, windowMs: 60000 };

      // Simular 5 chamadas simultâneas
      const results = Array.from({ length: 5 }, () => checkRateLimit("test", config));

      // Todas devem ser permitidas
      expect(results.every((r) => r.allowed)).toBe(true);

      // 6ª chamada bloqueada
      expect(checkRateLimit("test", config).allowed).toBe(false);
    });

    it("deve lidar com janelas de tempo muito curtas", () => {
      const config = { maxCalls: 2, windowMs: 100 };

      checkRateLimit("test", config);
      checkRateLimit("test", config);

      // Bloqueado
      expect(checkRateLimit("test", config).allowed).toBe(false);

      // Avançar 100ms
      vi.advanceTimersByTime(100);

      // Deve permitir novamente
      expect(checkRateLimit("test", config).allowed).toBe(true);
    });

    it("deve lidar com maxCalls = 1", () => {
      const config = { maxCalls: 1, windowMs: 60000 };

      // Primeira chamada permitida
      expect(checkRateLimit("test", config).allowed).toBe(true);

      // Segunda chamada bloqueada
      expect(checkRateLimit("test", config).allowed).toBe(false);
    });
  });
});
