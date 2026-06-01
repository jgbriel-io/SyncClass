import { describe, it, expect } from "vitest";
import {
  phoneSchema,
  phoneRequiredSchema,
  emailSchema,
  emailRequiredSchema,
  dateSchema,
  dateRequiredSchema,
  cepSchema,
  cepRequiredSchema,
  moneySchema,
  moneyRequiredSchema,
  nameSchema,
  observationsSchema,
  timeSchema,
  timeRequiredSchema,
  gradeSchema,
} from "./schemas";

describe("Validation Schemas", () => {
  describe("phoneSchema", () => {
    it("deve aceitar telefone fixo válido", () => {
      expect(phoneSchema.safeParse("(11) 1234-5678").success).toBe(true);
    });

    it("deve aceitar celular válido", () => {
      expect(phoneSchema.safeParse("(11) 91234-5678").success).toBe(true);
    });

    it("deve aceitar vazio", () => {
      expect(phoneSchema.safeParse("").success).toBe(true);
      expect(phoneSchema.safeParse(undefined).success).toBe(true);
    });

    it("deve rejeitar telefone inválido", () => {
      expect(phoneSchema.safeParse("123").success).toBe(false);
      expect(phoneSchema.safeParse("(11) 123").success).toBe(false);
    });
  });

  describe("emailSchema", () => {
    it("deve aceitar email válido", () => {
      expect(emailSchema.safeParse("test@example.com").success).toBe(true);
    });

    it("deve aceitar vazio", () => {
      expect(emailSchema.safeParse("").success).toBe(true);
      expect(emailSchema.safeParse(undefined).success).toBe(true);
    });

    it("deve rejeitar email inválido", () => {
      expect(emailSchema.safeParse("invalid").success).toBe(false);
      expect(emailSchema.safeParse("@example.com").success).toBe(false);
    });
  });

  describe("dateSchema", () => {
    it("deve aceitar data válida", () => {
      expect(dateSchema.safeParse("01/01/2024").success).toBe(true);
      expect(dateSchema.safeParse("31/12/2024").success).toBe(true);
    });

    it("deve aceitar vazio", () => {
      expect(dateSchema.safeParse("").success).toBe(true);
      expect(dateSchema.safeParse(undefined).success).toBe(true);
    });

    it("deve rejeitar data inválida", () => {
      expect(dateSchema.safeParse("32/01/2024").success).toBe(false);
      expect(dateSchema.safeParse("31/02/2024").success).toBe(false);
      expect(dateSchema.safeParse("01-01-2024").success).toBe(false);
    });
  });

  describe("cepSchema", () => {
    it("deve aceitar CEP válido", () => {
      expect(cepSchema.safeParse("12345-678").success).toBe(true);
    });

    it("deve aceitar vazio", () => {
      expect(cepSchema.safeParse("").success).toBe(true);
      expect(cepSchema.safeParse(undefined).success).toBe(true);
    });

    it("deve rejeitar CEP inválido", () => {
      expect(cepSchema.safeParse("12345").success).toBe(false);
      expect(cepSchema.safeParse("12345678").success).toBe(false);
    });
  });

  describe("moneySchema", () => {
    it("deve aceitar valor válido", () => {
      expect(moneySchema.safeParse("100,00").success).toBe(true);
      expect(moneySchema.safeParse("1.234,56").success).toBe(true);
      expect(moneySchema.safeParse("0,50").success).toBe(true);
    });

    it("deve aceitar vazio", () => {
      expect(moneySchema.safeParse("").success).toBe(true);
      expect(moneySchema.safeParse(undefined).success).toBe(true);
    });

    it("deve rejeitar valor inválido", () => {
      expect(moneySchema.safeParse("abc").success).toBe(false);
      expect(moneySchema.safeParse("100.00").success).toBe(false);
    });
  });

  describe("nameSchema", () => {
    it("deve aceitar nome válido", () => {
      expect(nameSchema.safeParse("João Silva").success).toBe(true);
      expect(nameSchema.safeParse("AB").success).toBe(true);
    });

    it("deve rejeitar nome muito curto", () => {
      expect(nameSchema.safeParse("A").success).toBe(false);
      expect(nameSchema.safeParse("").success).toBe(false);
    });

    it("deve rejeitar nome muito longo", () => {
      const longName = "A".repeat(101);
      expect(nameSchema.safeParse(longName).success).toBe(false);
    });
  });

  describe("observationsSchema", () => {
    it("deve aceitar observação válida", () => {
      expect(observationsSchema.safeParse("Observação teste").success).toBe(
        true
      );
    });

    it("deve aceitar vazio", () => {
      expect(observationsSchema.safeParse("").success).toBe(true);
      expect(observationsSchema.safeParse(undefined).success).toBe(true);
    });

    it("deve rejeitar observação muito longa", () => {
      const longText = "A".repeat(1001);
      expect(observationsSchema.safeParse(longText).success).toBe(false);
    });
  });

  describe("timeSchema", () => {
    it("deve aceitar horário válido", () => {
      expect(timeSchema.safeParse("00:00").success).toBe(true);
      expect(timeSchema.safeParse("12:30").success).toBe(true);
      expect(timeSchema.safeParse("23:59").success).toBe(true);
    });

    it("deve aceitar vazio", () => {
      expect(timeSchema.safeParse("").success).toBe(true);
      expect(timeSchema.safeParse(undefined).success).toBe(true);
    });

    it("deve rejeitar horário inválido", () => {
      expect(timeSchema.safeParse("24:00").success).toBe(false);
      expect(timeSchema.safeParse("12:60").success).toBe(false);
      expect(timeSchema.safeParse("12").success).toBe(false);
    });
  });

  describe("gradeSchema", () => {
    it("deve aceitar nota válida", () => {
      expect(gradeSchema.safeParse(0).success).toBe(true);
      expect(gradeSchema.safeParse(5).success).toBe(true);
      expect(gradeSchema.safeParse(10).success).toBe(true);
    });

    it("deve aceitar null", () => {
      expect(gradeSchema.safeParse(null).success).toBe(true);
      expect(gradeSchema.safeParse(undefined).success).toBe(true);
    });

    it("deve rejeitar nota fora do intervalo", () => {
      expect(gradeSchema.safeParse(-1).success).toBe(false);
      expect(gradeSchema.safeParse(11).success).toBe(false);
    });
  });
});
