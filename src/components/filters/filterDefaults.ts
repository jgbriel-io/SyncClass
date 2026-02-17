import type { ActivitiesFiltersState } from "./ActivitiesFilters";
import type { ClassesFiltersState } from "./ClassesFilters";
import type { FinancialFiltersState } from "./FinancialFilters";
import type { OverviewFiltersState } from "./OverviewFilters";
import type { StudentsFiltersState } from "./StudentsFilters";
import type { TeachersFiltersState } from "./TeachersFilters";
import type { UsersFiltersState } from "./UsersFilters";

export const defaultActivitiesFilters: ActivitiesFiltersState = {
  search: "",
  status: "all",
  studentId: "all",
  teacherId: "all",
  period: "all",
  sortBy: "due_asc",
};

export const defaultClassesFilters: ClassesFiltersState = {
  search: "",
  period: "all",
  teacherId: "all",
  studentId: "all",
  classType: "all",
  status: "em_aberto",
  sort: "recent",
};

export const defaultFinancialFilters: FinancialFiltersState = {
  search: "",
  periodPreset: "all",
  dateFrom: "",
  dateTo: "",
  status: "all",
  studentId: "all",
  sortBy: "created_desc",
};

export const defaultOverviewFilters: OverviewFiltersState = {
  search: "",
  status: "all",
  period: "all",
  teacherId: "all",
  studentId: "all",
  sortBy: "recent",
};

export const defaultStudentsFilters: StudentsFiltersState = {
  search: "",
  status: "all",
  teacherId: "all",
  sortBy: "name_asc",
  filterPreset: "all",
};

export const defaultTeachersFilters: TeachersFiltersState = {
  search: "",
  status: "all",
  specialization: "all",
  sortBy: "name_asc",
};

export const defaultUsersFilters: UsersFiltersState = {
  search: "",
  role: "all",
  status: "all",
  sortBy: "created_desc",
};
