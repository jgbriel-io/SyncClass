import { describe, it, expect, vi, afterEach } from "vitest";
import { getDateRangeForPeriod } from "./periodFilter";

describe("getDateRangeForPeriod", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("month", () => {
    it("retorna boundaries do mês corrente", () => {
      vi.setSystemTime(new Date("2025-06-15"));
      const { from, to } = getDateRangeForPeriod("month");
      expect(from).toBe("2025-06-01");
      expect(to).toBe("2025-06-30");
    });

    it("lida com mês de 31 dias", () => {
      vi.setSystemTime(new Date("2025-03-20"));
      const { from, to } = getDateRangeForPeriod("month");
      expect(from).toBe("2025-03-01");
      expect(to).toBe("2025-03-31");
    });

    it("lida com fevereiro (ano não bissexto)", () => {
      vi.setSystemTime(new Date("2025-02-10"));
      const { from, to } = getDateRangeForPeriod("month");
      expect(from).toBe("2025-02-01");
      expect(to).toBe("2025-02-28");
    });
  });

  describe("semester", () => {
    it("H1 (jan–jun) — retorna jan a jun", () => {
      vi.setSystemTime(new Date("2025-03-10"));
      const { from, to } = getDateRangeForPeriod("semester");
      expect(from).toBe("2025-01-01");
      expect(to).toBe("2025-06-30");
    });

    it("H2 (jul–dez) — retorna jul a dez", () => {
      vi.setSystemTime(new Date("2025-09-01"));
      const { from, to } = getDateRangeForPeriod("semester");
      expect(from).toBe("2025-07-01");
      expect(to).toBe("2025-12-31");
    });

    it("boundary: junho ainda é H1", () => {
      vi.setSystemTime(new Date("2025-06-30"));
      const { from, to } = getDateRangeForPeriod("semester");
      expect(from).toBe("2025-01-01");
      expect(to).toBe("2025-06-30");
    });

    it("boundary: julho já é H2", () => {
      vi.setSystemTime(new Date("2025-07-01T12:00:00"));
      const { from, to } = getDateRangeForPeriod("semester");
      expect(from).toBe("2025-07-01");
      expect(to).toBe("2025-12-31");
    });
  });

  describe("year", () => {
    it("retorna boundaries do ano corrente", () => {
      vi.setSystemTime(new Date("2025-11-20"));
      const { from, to } = getDateRangeForPeriod("year");
      expect(from).toBe("2025-01-01");
      expect(to).toBe("2025-12-31");
    });

    it("funciona no início do ano", () => {
      vi.setSystemTime(new Date("2025-01-01T12:00:00"));
      const { from, to } = getDateRangeForPeriod("year");
      expect(from).toBe("2025-01-01");
      expect(to).toBe("2025-12-31");
    });
  });
});
