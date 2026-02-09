import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isOverdue } from "@/lib/utils/financialStatus";
import { Student } from "./useStudents";

const DEFAULT_PAGE_SIZE = 10;

export interface StudentClassLog {
  id: string;
  class_date: string;
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number | null;
  attendance: boolean | null;
  grade: number | null;
  feedback: string | null;
  title: string | null;
  billed_amount: number | null;
  teacher_id: string | null;
  teacher_name?: string;
  created_at: string | null;
}

export interface StudentFinancialRecord {
  id: string;
  amount: number;
  due_date: string;
  status: "pendente" | "pago" | "atrasado" | null;
  description: string | null;
  paid_at: string | null;
  created_at: string | null;
}

export interface StudentDetails extends Student {
  classLogs: StudentClassLog[];
  financialRecords: StudentFinancialRecord[];
  stats: {
    totalClasses: number;
    presentClasses: number;
    averageGrade: number;
    attendanceRate: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
  };
}

export function useStudentDetails(studentId: string | null) {
  return useQuery({
    queryKey: ["student_details", studentId],
    queryFn: async (): Promise<StudentDetails | null> => {
      if (!studentId) return null;

      // Fetch student data
      // Use students_masked para mascarar CPF e telefone conforme LGPD
      const { data: student, error: studentError } = await supabase
        .from("students_masked")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!student) return null;

      // Fetch class logs (teachers_masked por RLS: aluno não pode ler teachers)
      const { data: classLogs, error: classLogsError } = await supabase
        .from("class_logs")
        .select(`
          id,
          class_date,
          start_at,
          end_at,
          duration_minutes,
          attendance,
          grade,
          feedback,
          title,
          billed_amount,
          teacher_id,
          teachers_masked(name),
          created_at
        `)
        .eq("student_id", studentId)
        .order("class_date", { ascending: false });

      if (classLogsError) throw classLogsError;

      // Nome do professor do aluno como fallback (teachers_masked por RLS)
      let studentTeacherName: string | undefined;
      if (student.teacher_id) {
        const { data: teacherData } = await supabase
          .from("teachers_masked")
          .select("name")
          .eq("id", student.teacher_id)
          .maybeSingle();
        studentTeacherName = teacherData?.name ?? undefined;
      }

      const rawLogs = (classLogs || []) as Array<Record<string, unknown> & { teachers_masked?: { name?: string } | null }>;
      const mappedClassLogs: StudentClassLog[] = rawLogs.map((log) => ({
        id: log.id as string,
        class_date: log.class_date as string,
        start_at: log.start_at as string | null,
        end_at: log.end_at as string | null,
        duration_minutes: log.duration_minutes as number | null,
        attendance: log.attendance as boolean | null,
        grade: log.grade as number | null,
        feedback: log.feedback as string | null,
        title: log.title as string | null,
        billed_amount: log.billed_amount as number | null,
        teacher_id: (log.teacher_id ?? student.teacher_id) as string | null,
        teacher_name: log.teachers_masked?.name ?? studentTeacherName,
        created_at: log.created_at as string | null,
      }));

      // Fetch financial records
      const { data: financialRecords, error: financialError } = await supabase
        .from("financial_records")
        .select("id, amount, due_date, status, description, paid_at, created_at")
        .eq("student_id", studentId)
        .order("due_date", { ascending: false });

      if (financialError) throw financialError;

      // Calculate stats
      const totalClasses = classLogs?.length || 0;
      const presentClasses = classLogs?.filter((log) => log.attendance).length || 0;
      const gradesWithValue = classLogs?.filter((log) => log.grade !== null) || [];
      const averageGrade =
        gradesWithValue.length > 0
          ? gradesWithValue.reduce((sum, log) => sum + (log.grade || 0), 0) / gradesWithValue.length
          : 0;
      const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

      let totalPaid = 0;
      let totalPending = 0;
      let totalOverdue = 0;

      financialRecords?.forEach((record) => {
        const amount = Number(record.amount) || 0;
        if (record.status === "pago") {
          totalPaid += amount;
        } else {
          if (isOverdue(record.due_date)) {
            totalOverdue += amount;
          } else {
            totalPending += amount;
          }
        }
      });

      return {
        ...student,
        classLogs: mappedClassLogs,
        financialRecords: financialRecords || [],
        stats: {
          totalClasses,
          presentClasses,
          averageGrade,
          attendanceRate,
          totalPaid,
          totalPending,
          totalOverdue,
        },
      };
    },
    enabled: !!studentId,
  });
}

export function useStudentsWithStats() {
  return useQuery({
    queryKey: ["students_with_stats"],
    queryFn: async () => {
      // Fetch all students
      // Use students_masked para mascarar CPF e telefone conforme LGPD
      const { data: students, error: studentsError } = await supabase
        .from("students_masked")
        .select("*")
        .order("name", { ascending: true });

      if (studentsError) throw studentsError;

      // Fetch all class logs
      const { data: allClassLogs, error: classLogsError } = await supabase
        .from("class_logs")
        .select("student_id, attendance, grade");

      if (classLogsError) throw classLogsError;

      // Fetch all financial records
      const { data: allFinancialRecords, error: financialError } = await supabase
        .from("financial_records")
        .select("student_id, amount, status, due_date");

      if (financialError) throw financialError;

      // Map stats to each student
      return students.map((student) => {
        const studentClassLogs = allClassLogs?.filter((log) => log.student_id === student.id) || [];
        const studentFinancialRecords = allFinancialRecords?.filter((rec) => rec.student_id === student.id) || [];

        const totalClasses = studentClassLogs.length;
        const presentClasses = studentClassLogs.filter((log) => log.attendance).length;
        const gradesWithValue = studentClassLogs.filter((log) => log.grade !== null);
        const averageGrade =
          gradesWithValue.length > 0
            ? gradesWithValue.reduce((sum, log) => sum + (log.grade || 0), 0) / gradesWithValue.length
            : null;
        const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : null;

        let totalPaid = 0;
        let totalPending = 0;
        let totalOverdue = 0;

        studentFinancialRecords.forEach((record) => {
          const amount = Number(record.amount) || 0;
          if (record.status === "pago") {
            totalPaid += amount;
          } else {
            if (isOverdue(record.due_date)) {
              totalOverdue += amount;
            } else {
              totalPending += amount;
            }
          }
        });

        return {
          ...student,
          stats: {
            totalClasses,
            presentClasses,
            averageGrade,
            attendanceRate,
            totalPaid,
            totalPending,
            totalOverdue,
          },
        };
      });
    },
  });
}

export interface StudentWithStats extends Student {
  stats: {
    totalClasses: number;
    presentClasses: number;
    averageGrade: number | null;
    attendanceRate: number | null;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
  };
}

export interface UseStudentsWithStatsPaginatedOptions {
  pageSize?: number;
}

export interface UseStudentsWithStatsPaginatedResult {
  data: StudentWithStats[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

export function useStudentsWithStatsPaginated(
  options?: UseStudentsWithStatsPaginatedOptions
): UseStudentsWithStatsPaginatedResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  const query = useQuery({
    queryKey: ["students_with_stats_paginated", page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data: students, error: studentsError, count } = await supabase
        .from("students_masked")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(from, to);

      if (studentsError) throw studentsError;

      const studentRows = students ?? [];
      const ids = studentRows.map((s: { id: string }) => s.id);
      if (ids.length === 0) return { list: [] as StudentWithStats[], count: count ?? 0 };

      const [classLogsRes, financialRes] = await Promise.all([
        supabase.from("class_logs").select("student_id, attendance, grade").in("student_id", ids),
        supabase.from("financial_records").select("student_id, amount, status, due_date").in("student_id", ids),
      ]);

      if (classLogsRes.error) throw classLogsRes.error;
      if (financialRes.error) throw financialRes.error;

      const allClassLogs = classLogsRes.data ?? [];
      const allFinancialRecords = financialRes.data ?? [];

      const list = studentRows.map((student: Student) => {
        const studentClassLogs = allClassLogs.filter((log: { student_id: string }) => log.student_id === student.id);
        const studentFinancialRecords = allFinancialRecords.filter(
          (rec: { student_id: string }) => rec.student_id === student.id
        );

        const totalClasses = studentClassLogs.length;
        const presentClasses = studentClassLogs.filter((log: { attendance: boolean }) => log.attendance).length;
        const gradesWithValue = studentClassLogs.filter((log: { grade: number | null }) => log.grade !== null);
        const averageGrade =
          gradesWithValue.length > 0
            ? gradesWithValue.reduce((sum: number, log: { grade: number | null }) => sum + (log.grade || 0), 0) /
              gradesWithValue.length
            : null;
        const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : null;

        let totalPaid = 0;
        let totalPending = 0;
        let totalOverdue = 0;

        studentFinancialRecords.forEach((record: { amount: number; status: string; due_date: string }) => {
          const amount = Number(record.amount) || 0;
          if (record.status === "pago") {
            totalPaid += amount;
          } else {
            if (isOverdue(record.due_date)) {
              totalOverdue += amount;
            } else {
              totalPending += amount;
            }
          }
        });

        return {
          ...student,
          stats: {
            totalClasses,
            presentClasses,
            averageGrade,
            attendanceRate,
            totalPaid,
            totalPending,
            totalOverdue,
          },
        };
      });

      return { list: list as StudentWithStats[], count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as StudentWithStats[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

  return {
    data: list,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isFetching: query.isFetching,
    page,
    setPage,
    hasMore,
    totalCount,
    refetch: query.refetch,
  };
}
