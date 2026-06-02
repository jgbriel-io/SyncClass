import { useMemo } from "react";
import { Teacher } from "@/hooks/useTeachers";
import { Student } from "@/hooks/useStudents";
import { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";
import { TeachersFiltersState } from "@/components/filters/TeachersFilters";
import {
  type PeriodFilter,
  getDateRangeForPeriod,
} from "@/lib/utils/periodFilter";

type TeacherWithSpec = Teacher & { specialization?: string | null };

export function useTeachersPageStats(
  allTeachers: Teacher[],
  allStudents: Student[],
  allClassLogs: ClassLogWithStudent[],
  allFinancialRecords: FinancialRecordWithRelations[],
  teachers: Teacher[],
  filters: TeachersFiltersState,
  period: PeriodFilter = "month"
) {
  const studentCountByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    allStudents.forEach((student) => {
      if (student.teacher_id && student.status === "ativo") {
        map.set(student.teacher_id, (map.get(student.teacher_id) || 0) + 1);
      }
    });
    return map;
  }, [allStudents]);

  const totalClassesByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    allClassLogs.forEach((log) => {
      const teacherId = log.students?.teacher_id;
      if (teacherId && log.attendance) {
        map.set(teacherId, (map.get(teacherId) || 0) + 1);
      }
    });
    return map;
  }, [allClassLogs]);

  const totalReceivedByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    allFinancialRecords.forEach((record) => {
      const teacherId = record.students?.teacher_id;
      if (teacherId && record.status === "pago" && record.amount) {
        map.set(teacherId, (map.get(teacherId) || 0) + Number(record.amount));
      }
    });
    return map;
  }, [allFinancialRecords]);

  const specializations = useMemo(() => {
    const set = new Set<string>();
    allTeachers.forEach((t) => {
      const s = (t as TeacherWithSpec).specialization;
      if (s?.trim()) set.add(s.trim());
    });
    return Array.from(set).sort();
  }, [allTeachers]);

  // Tech debt: filters only current page (server-paginated `teachers`, not `allTeachers`)
  // Full-dataset client filtering would require passing allTeachers here instead
  const filteredTeachers = useMemo(() => {
    let result = teachers.filter((teacher) => {
      const searchLower = filters.search.toLowerCase().trim();
      const searchDigits = searchLower.replace(/\D/g, "");
      const name = (teacher.name ?? "").toLowerCase();
      const email = (teacher.email ?? "").toLowerCase();
      const phoneDigits = (teacher.phone ?? "").replace(/\D/g, "");
      const matchesSearch =
        !searchLower ||
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        (searchDigits.length > 0 && phoneDigits.includes(searchDigits));
      if (!matchesSearch) return false;

      const status = teacher.status ?? "ativo";
      if (filters.status !== "all" && status !== filters.status) return false;

      const spec = (
        teacher as Teacher & { specialization?: string | null }
      ).specialization?.trim();
      if (filters.specialization !== "all" && spec !== filters.specialization)
        return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      const nameA = (a.name ?? "").toLowerCase();
      const nameB = (b.name ?? "").toLowerCase();
      if (filters.sortBy === "name_asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });
    return result;
  }, [teachers, filters]);

  const teachersStats = useMemo(() => {
    const { from, to } = getDateRangeForPeriod(period);
    return {
      total: allTeachers.length,
      ativos: allTeachers.filter((t) => (t.status ?? "ativo") === "ativo")
        .length,
      inativos: allTeachers.filter((t) => t.status === "inativo").length,
      // novos: global platform stat (allTeachers), not scoped to current page filters
      novos: allTeachers.filter((t) => {
        if (!t.created_at) return false;
        const d = String(t.created_at).split("T")[0];
        return d >= from && d <= to;
      }).length,
    };
  }, [allTeachers, period]);

  return {
    studentCountByTeacher,
    totalClassesByTeacher,
    totalReceivedByTeacher,
    specializations,
    filteredTeachers,
    teachersStats,
  };
}
