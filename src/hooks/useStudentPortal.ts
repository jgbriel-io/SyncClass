import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import { useAuth } from "@/contexts/AuthContext";

interface StudentProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface StudentClassLog {
  id: string;
  class_date: string;
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number | null;
  attendance: boolean | null;
  grade: number | null;
  feedback: string | null;
  title?: string | null;
  billed_amount?: number | null;
  teacher_id?: string | null;
  teacher_name?: string;
  payment_status?: string | null;
  payment_due_date?: string | null;
  is_package?: boolean;
  observations?: string | null;
}

interface StudentFinancialRecord {
  id: string;
  amount: number;
  due_date: string;
  description: string | null;
  status:
    | "pendente"
    | "pago"
    | "atrasado"
    | "validando"
    | "abonado"
    | "extornado"
    | "cancelado";
  paid_at: string | null;
  payment_provider?: string | null;
  pix_code?: string | null;
  pix_expires_at?: string | null;
  external_payment_id?: string | null;
}

interface StudentStats {
  totalClasses: number;
  attendanceRate: number;
  averageGrade: number;
  totalPaid: number;
  totalPending: number;
  hasPendingPayments: boolean;
}

export function useStudentProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QK.STUDENT_PROFILE, user?.id],
    queryFn: async () => {
      // First get the student_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("student_id, full_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.student_id) return null;

      // Then get the student data
      // Use students_masked para garantir mascaramento LGPD
      // Nota: O aluno vê seus próprios dados mascarados por questão de conformidade
      const { data: student, error: studentError } = await supabase
        .from("students_masked")
        .select("id, name, email, phone")
        .eq("id", profile.student_id)
        .maybeSingle();

      if (studentError) throw studentError;

      return student as StudentProfile | null;
    },
    enabled: !!user?.id,
  });
}

export function useStudentClassLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QK.STUDENT_CLASS_LOGS_V2, user?.id],
    queryFn: async () => {
      // First get the student_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("student_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.student_id) return [];

      // Student data: students_masked (aluno pode ler; teachers não)
      const { data: student, error: studentError } = await supabase
        .from("students_masked")
        .select("teacher_id")
        .eq("id", profile.student_id)
        .maybeSingle();

      if (studentError) throw studentError;

      let studentTeacherName: string | undefined;
      if (student?.teacher_id) {
        const { data: teacher } = await supabase
          .from("teachers_masked")
          .select("name")
          .eq("id", student.teacher_id)
          .maybeSingle();
        studentTeacherName = teacher?.name;
      }

      // Class logs - buscar teacher name separadamente para evitar erro de join com view
      const { data, error } = await supabase
        .from("class_logs")
        .select(
          `
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
          observations,
          teacher_id
        `
        )
        .eq("student_id", profile.student_id)
        .order("class_date", { ascending: false })
        .order("start_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Buscar nome do professor se houver teacher_id
      let teacherName: string | undefined;
      if (data && data.length > 0 && data[0].teacher_id) {
        const { data: teacherData } = await supabase
          .from("teachers_masked")
          .select("name")
          .eq("id", data[0].teacher_id)
          .single();

        if (teacherData) {
          teacherName = teacherData.name;
        }
      }

      // Buscar financial_records separadamente para cada class_log
      const classLogIds = (data || []).map((log) => log.id);
      const financialRecordsMap = new Map<
        string,
        { status: string; due_date: string }
      >();
      const packageClassLogIds = new Set<string>();

      if (classLogIds.length > 0) {
        // Buscar cobranças diretas (class_log_id preenchido)
        const { data: financialData } = await supabase
          .from("financial_records")
          .select("id, class_log_id, status, due_date")
          .in("class_log_id", classLogIds)
          .eq("student_id", profile.student_id);

        if (financialData) {
          financialData.forEach((fr) => {
            if (fr.class_log_id) {
              financialRecordsMap.set(fr.class_log_id, {
                status: fr.status,
                due_date: fr.due_date,
              });
            }
          });
        }

        // Buscar cobranças de pacote (via tabela de relacionamento)
        const { data: packageLinks } = await supabase
          .from("financial_record_class_logs")
          .select(
            `
            class_log_id,
            financial_records!inner(id, status, due_date)
          `
          )
          .in("class_log_id", classLogIds);

        if (packageLinks) {
          packageLinks.forEach(
            (link: {
              class_log_id: string;
              financial_records: { status: string; due_date: string };
            }) => {
              if (link.class_log_id && link.financial_records) {
                packageClassLogIds.add(link.class_log_id);
                // Se já não tem cobrança direta, adiciona a do pacote
                if (!financialRecordsMap.has(link.class_log_id)) {
                  financialRecordsMap.set(link.class_log_id, {
                    status: link.financial_records.status,
                    due_date: link.financial_records.due_date,
                  });
                }
              }
            }
          );
        }
      }

      const mappedLogs = (data || []).map((log: Record<string, unknown>) => {
        const logTeacherName = teacherName ?? studentTeacherName;
        const logTeacherId = log.teacher_id ?? student?.teacher_id;

        // Buscar financial_record do map
        const financialRecord =
          financialRecordsMap.get(log.id as string) ?? null;
        const isPackage = packageClassLogIds.has(log.id as string);

        return {
          id: log.id,
          class_date: log.class_date,
          start_at: log.start_at,
          end_at: log.end_at,
          duration_minutes: log.duration_minutes,
          attendance: log.attendance,
          grade: log.grade,
          feedback: log.feedback,
          title: log.title,
          billed_amount: log.billed_amount,
          teacher_id: logTeacherId,
          teacher_name: logTeacherName,
          payment_status: financialRecord?.status ?? null,
          payment_due_date: financialRecord?.due_date ?? null,
          is_package: isPackage,
          observations: log.observations,
        };
      });

      return mappedLogs as StudentClassLog[];
    },
    enabled: !!user?.id,
  });
}

export function useStudentFinancialRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QK.STUDENT_FINANCIAL_RECORDS, user?.id],
    queryFn: async () => {
      // First get the student_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("student_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.student_id) return [];

      // Then get the financial records for this student
      const { data, error } = await supabase
        .from("financial_records")
        .select(
          "id, amount, due_date, description, status, paid_at, payment_provider, pix_code, pix_expires_at, external_payment_id"
        )
        .eq("student_id", profile.student_id)
        .order("due_date", { ascending: false });

      if (error) throw error;

      return (data || []).map((record) => ({
        ...record,
        status: getFinancialActualStatus(record),
      })) as StudentFinancialRecord[];
    },
    enabled: !!user?.id,
  });
}

export function useStudentStats() {
  const { data: classLogs = [] } = useStudentClassLogs();
  const { data: financialRecords = [] } = useStudentFinancialRecords();

  const stats: StudentStats = {
    totalClasses: classLogs.length,
    attendanceRate: 0,
    averageGrade: 0,
    totalPaid: 0,
    totalPending: 0,
    hasPendingPayments: false,
  };

  // Calculate attendance rate
  if (classLogs.length > 0) {
    const presentCount = classLogs.filter((log) => log.attendance).length;
    stats.attendanceRate = (presentCount / classLogs.length) * 100;
  }

  // Calculate average grade
  const gradesWithValue = classLogs.filter((log) => log.grade !== null);
  if (gradesWithValue.length > 0) {
    const sum = gradesWithValue.reduce((acc, log) => acc + (log.grade || 0), 0);
    stats.averageGrade = sum / gradesWithValue.length;
  }

  // Calculate financial stats
  financialRecords.forEach((record) => {
    const amount = Number(record.amount) || 0;
    if (record.status === "pago") {
      stats.totalPaid += amount;
    } else {
      stats.totalPending += amount;
      stats.hasPendingPayments = true;
    }
  });

  return stats;
}

export function useLastClass() {
  const { data: classLogs = [] } = useStudentClassLogs();

  if (classLogs.length === 0) return null;

  // Get the most recent class with attendance
  const lastClass = classLogs.find((log) => log.attendance);
  return lastClass || classLogs[0];
}

export function useCheckoutPaymentStatus(
  recordId: string | undefined,
  onPaid: () => void
) {
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    if (!recordId) return;

    const channel = supabase
      .channel(`checkout-${recordId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "financial_records",
          filter: `id=eq.${recordId}`,
        },
        (payload) => {
          if ((payload.new as { status?: string })?.status === "pago") {
            onPaidRef.current();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recordId]);
}
