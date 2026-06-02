import { describe, it, expect } from "vitest";
import {
  defaultActivitiesFilters,
  defaultClassesFilters,
  defaultFinancialFilters,
  defaultOverviewFilters,
  defaultStudentsFilters,
  defaultTeachersFilters,
  defaultUsersFilters,
} from "./filterDefaults";

describe("filterDefaults", () => {
  describe("defaultActivitiesFilters", () => {
    it("should have correct default values", () => {
      expect(defaultActivitiesFilters).toEqual({
        search: "",
        status: "all",
        studentId: "all",
        teacherId: "all",
        period: "all",
        sortBy: "due_asc",
      });
    });
  });

  describe("defaultClassesFilters", () => {
    it("should have correct default values", () => {
      expect(defaultClassesFilters).toEqual({
        search: "",
        period: "all",
        teacherId: "all",
        studentId: "all",
        classType: "all",
        status: "em_aberto",
        sort: "recent",
      });
    });
  });

  describe("defaultFinancialFilters", () => {
    it("should have correct default values", () => {
      expect(defaultFinancialFilters).toEqual({
        search: "",
        periodPreset: "all",
        dateFrom: "",
        dateTo: "",
        status: "all",
        studentId: "all",
        sortBy: "created_desc",
      });
    });
  });

  describe("defaultOverviewFilters", () => {
    it("should have correct default values", () => {
      expect(defaultOverviewFilters).toEqual({
        search: "",
        status: "all",
        period: "all",
        teacherId: "all",
        studentId: "all",
        sortBy: "recent",
      });
    });
  });

  describe("defaultStudentsFilters", () => {
    it("should have correct default values", () => {
      expect(defaultStudentsFilters).toEqual({
        search: "",
        status: "all",
        teacherId: "all",
        sortBy: "name_asc",
        filterPreset: "all",
      });
    });
  });

  describe("defaultTeachersFilters", () => {
    it("should have correct default values", () => {
      expect(defaultTeachersFilters).toEqual({
        search: "",
        status: "all",
        specialization: "all",
        sortBy: "name_asc",
      });
    });
  });

  describe("defaultUsersFilters", () => {
    it("should have correct default values", () => {
      expect(defaultUsersFilters).toEqual({
        search: "",
        role: "all",
        status: "all",
        sortBy: "created_desc",
      });
    });
  });
});
