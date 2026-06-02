/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTeachersPageStats } from "./useTeachersPageStats";
import { defaultTeachersFilters } from "@/components/filters/filterDefaults";

const makeTeacher = (
  id: string,
  opts: { status?: "ativo" | "inativo"; created_at?: string } = {}
) => ({
  id,
  name: `Prof ${id}`,
  email: `${id}@test.com`,
  status: opts.status ?? "ativo",
  created_at: opts.created_at ?? "2025-01-01T00:00:00",
  phone: null,
  specialization: null,
});

const emptyArgs = {
  allStudents: [],
  allClassLogs: [],
  allFinancialRecords: [],
  teachers: [],
  filters: defaultTeachersFilters,
} as const;

describe("useTeachersPageStats", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("teachersStats — totais gerais", () => {
    it("conta total, ativos e inativos corretamente", () => {
      vi.setSystemTime(new Date("2025-06-15"));
      const allTeachers = [
        makeTeacher("1", { status: "ativo" }),
        makeTeacher("2", { status: "ativo" }),
        makeTeacher("3", { status: "inativo" }),
      ];

      const { result } = renderHook(() =>
        useTeachersPageStats(
          allTeachers as any,
          emptyArgs.allStudents,
          emptyArgs.allClassLogs as any,
          emptyArgs.allFinancialRecords as any,
          emptyArgs.teachers as any,
          emptyArgs.filters,
          "month"
        )
      );

      expect(result.current.teachersStats.total).toBe(3);
      expect(result.current.teachersStats.ativos).toBe(2);
      expect(result.current.teachersStats.inativos).toBe(1);
    });

    it("trata status ausente como ativo", () => {
      vi.setSystemTime(new Date("2025-06-15"));
      const allTeachers = [makeTeacher("1", { status: undefined as any })];

      const { result } = renderHook(() =>
        useTeachersPageStats(
          allTeachers as any,
          emptyArgs.allStudents,
          emptyArgs.allClassLogs as any,
          emptyArgs.allFinancialRecords as any,
          emptyArgs.teachers as any,
          emptyArgs.filters,
          "month"
        )
      );

      expect(result.current.teachersStats.ativos).toBe(1);
    });
  });

  describe("teachersStats.novos — filtro por período", () => {
    it("month — conta apenas criados no mês corrente", () => {
      vi.setSystemTime(new Date("2025-06-15"));
      const allTeachers = [
        makeTeacher("1", { created_at: "2025-06-01T00:00:00" }), // dentro
        makeTeacher("2", { created_at: "2025-06-30T00:00:00" }), // dentro
        makeTeacher("3", { created_at: "2025-05-31T00:00:00" }), // fora
        makeTeacher("4", { created_at: "2025-07-01T00:00:00" }), // fora
      ];

      const { result } = renderHook(() =>
        useTeachersPageStats(
          allTeachers as any,
          emptyArgs.allStudents,
          emptyArgs.allClassLogs as any,
          emptyArgs.allFinancialRecords as any,
          emptyArgs.teachers as any,
          emptyArgs.filters,
          "month"
        )
      );

      expect(result.current.teachersStats.novos).toBe(2);
    });

    it("semester (H1) — conta jan a jun", () => {
      vi.setSystemTime(new Date("2025-04-10"));
      const allTeachers = [
        makeTeacher("1", { created_at: "2025-01-01T00:00:00" }), // dentro H1
        makeTeacher("2", { created_at: "2025-06-30T00:00:00" }), // dentro H1
        makeTeacher("3", { created_at: "2024-12-31T00:00:00" }), // fora (ano anterior)
        makeTeacher("4", { created_at: "2025-07-01T00:00:00" }), // fora (H2)
      ];

      const { result } = renderHook(() =>
        useTeachersPageStats(
          allTeachers as any,
          emptyArgs.allStudents,
          emptyArgs.allClassLogs as any,
          emptyArgs.allFinancialRecords as any,
          emptyArgs.teachers as any,
          emptyArgs.filters,
          "semester"
        )
      );

      expect(result.current.teachersStats.novos).toBe(2);
    });

    it("semester (H2) — conta jul a dez", () => {
      vi.setSystemTime(new Date("2025-09-01"));
      const allTeachers = [
        makeTeacher("1", { created_at: "2025-07-01T00:00:00" }), // dentro H2
        makeTeacher("2", { created_at: "2025-12-31T00:00:00" }), // dentro H2
        makeTeacher("3", { created_at: "2025-06-30T00:00:00" }), // fora (H1)
      ];

      const { result } = renderHook(() =>
        useTeachersPageStats(
          allTeachers as any,
          emptyArgs.allStudents,
          emptyArgs.allClassLogs as any,
          emptyArgs.allFinancialRecords as any,
          emptyArgs.teachers as any,
          emptyArgs.filters,
          "semester"
        )
      );

      expect(result.current.teachersStats.novos).toBe(2);
    });

    it("year — conta todos do ano corrente", () => {
      vi.setSystemTime(new Date("2025-11-20"));
      const allTeachers = [
        makeTeacher("1", { created_at: "2025-01-01T00:00:00" }), // dentro
        makeTeacher("2", { created_at: "2025-12-31T00:00:00" }), // dentro
        makeTeacher("3", { created_at: "2024-12-31T00:00:00" }), // fora (ano anterior)
      ];

      const { result } = renderHook(() =>
        useTeachersPageStats(
          allTeachers as any,
          emptyArgs.allStudents,
          emptyArgs.allClassLogs as any,
          emptyArgs.allFinancialRecords as any,
          emptyArgs.teachers as any,
          emptyArgs.filters,
          "year"
        )
      );

      expect(result.current.teachersStats.novos).toBe(2);
    });

    it("professor sem created_at não conta em nenhum período", () => {
      vi.setSystemTime(new Date("2025-06-15"));
      const allTeachers = [makeTeacher("1", { created_at: undefined as any })];

      const { result } = renderHook(() =>
        useTeachersPageStats(
          allTeachers as any,
          emptyArgs.allStudents,
          emptyArgs.allClassLogs as any,
          emptyArgs.allFinancialRecords as any,
          emptyArgs.teachers as any,
          emptyArgs.filters,
          "month"
        )
      );

      expect(result.current.teachersStats.novos).toBe(0);
    });

    it("default period é month quando não informado", () => {
      vi.setSystemTime(new Date("2025-06-15"));
      const allTeachers = [
        makeTeacher("1", { created_at: "2025-06-10T00:00:00" }),
        makeTeacher("2", { created_at: "2025-05-01T00:00:00" }),
      ];

      const { result } = renderHook(() =>
        useTeachersPageStats(
          allTeachers as any,
          emptyArgs.allStudents,
          emptyArgs.allClassLogs as any,
          emptyArgs.allFinancialRecords as any,
          emptyArgs.teachers as any,
          emptyArgs.filters
          // period omitido — default "month"
        )
      );

      expect(result.current.teachersStats.novos).toBe(1);
    });
  });
});
