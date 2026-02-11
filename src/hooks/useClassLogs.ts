import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { getClassStatusWithTime } from "@/lib/utils/classTime";

const DEFAULT_PAGE_SIZE = 10;

export type ClassLogsStatusFilter = "all" | "agendada" | "avaliacao_pendente" | "concluida";

export type ClassLogsFilters = {
  teacherId?: string;
  period?: "all" | "week" | "month" | "3months";
  status?: ClassLogsStatusFilter;
};

function getDateRangeForPeriod(period: "week" | "month" | "3months"): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  let from: Date;
  let to: Date;
  if (period === "week") {
    const start = new Date(y, m, d);
    start.setDate(start.getDate() - start.getDay());
    from = start;
    to = new Date(start);
    to.setDate(to.getDate() + 6);
  } else if (period === "month") {
    from = new Date(y, m, 1);
    to = new Date(y, m + 1, 0);
  } else {
    from = new Date(y, m - 3, d);
    to = new Date(y, m, d);
  }
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

/** Verifica se há sobreposição de horários para o mesmo professor na mesma data */
async function checkClassOverlap(
  teacherId: string | null,
  classDate: string,
  startAt: string | null,
  endAt: string | null,
  excludeId?: string
): Promise<{ overlap: boolean; message?: string }> {
  if (!teacherId || !startAt || !endAt) return { overlap: false };
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (start >= end) return { overlap: false };

  const { data: existing, error } = await supabase
    .from("class_logs")
    .select("id, start_at, end_at")
    .eq("teacher_id", teacherId)
    .eq("class_date", classDate)
    .not("start_at", "is", null)
    .not("end_at", "is", null);

  if (error) throw error;

  for (const row of existing || []) {
    if (excludeId && row.id === excludeId) continue;
    const rowStart = new Date(row.start_at!).getTime();
    const rowEnd = new Date(row.end_at!).getTime();
    const overlaps = start < rowEnd && rowStart < end;
    if (overlaps) {
      return {
        overlap: true,
        message: "Já existe outra aula neste horário para este professor. Escolha outro intervalo.",
      };
    }
  }
  return { overlap: false };
}

export type ClassLog = Tables<"class_logs">;
export type ClassLogInsert = TablesInsert<"class_logs">;
export type ClassLogUpdate = TablesUpdate<"class_logs">;

export interface ClassLogWithStudent extends ClassLog {
  title?: string | null;
  students: {
    name: string;
    teacher_id?: string | null;
  } | null;
  teachers?: {
    name: string;
  } | null;
  financial_records: {
    id: string;
    status: "pendente" | "pago" | "atrasado" | null;
    amount: number;
    due_date: string;
    description?: string | null;
  } | null;
  /** true quando a cobrança foi vinculada via pacote (financial_record_class_logs) */
  financial_record_via_package?: boolean;
}

export interface ClassLogWithFinancialData {
  classLog: ClassLogInsert;
  createFinancial: boolean;
  /** amount = classLog.billed_amount ?? (hourly_rate * (duration_minutes / 60)); usado ao criar financial_records */
  financialData?: {
    amount: number;
    due_date: string;
    description?: string;
    payment_method?: string | null;
  };
}

export interface UseClassLogsOptions {
  pageSize?: number;
  filters?: ClassLogsFilters;
}

export interface UseClassLogsResult {
  data: ClassLogWithStudent[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

export function useClassLogs(teacherId?: string, options?: UseClassLogsOptions): UseClassLogsResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: ["class_logs", teacherId, page, pageSize, filters],
    queryFn: async () => {
      let q = supabase
        .from("class_logs")
        .select(
          `
          *,
          students (
            name,
            teacher_id
          ),
          teachers (
            name
          ),
          financial_records (
            id,
            status,
            amount,
            due_date
          )
        `,
          { count: "exact" }
        )
        .order("class_date", { ascending: false });

      const effectiveTeacherId = teacherId ?? (filters?.teacherId !== "all" ? filters?.teacherId : undefined);
      
      // Filtra por students.teacher_id (professor do aluno) em vez de class_logs.teacher_id
      // porque class_logs.teacher_id pode ser NULL mesmo quando a aula pertence a um aluno desse professor
      if (effectiveTeacherId) {
        const { data: teacherStudentIds } = await supabase
          .from("students")
          .select("id")
          .eq("teacher_id", effectiveTeacherId);
        
        if (teacherStudentIds && teacherStudentIds.length > 0) {
          q = q.in("student_id", teacherStudentIds.map(s => s.id));
        } else {
          return { list: [] as ClassLogWithStudent[], count: 0 };
        }
      }

      if (filters?.period && filters.period !== "all") {
        const { from, to } = getDateRangeForPeriod(filters.period);
        q = q.gte("class_date", from).lte("class_date", to);
      }

      // NÃO aplicar filtro de status no banco - deixar tudo client-side
      // Isso garante que todas as aulas sejam retornadas e filtradas no componente

      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await q.range(from, to);

      if (error) throw error;
      const list = (data ?? []) as ClassLogWithStudent[];
      await enrichWithPackageFinancial(list);
      return { list, count: count ?? 0 };
    },
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as ClassLogWithStudent[];
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

/** Enriquece lista de aulas com financial_records vindos de pacote (financial_record_class_logs). */
async function enrichWithPackageFinancial(
  list: ClassLogWithStudent[]
): Promise<ClassLogWithStudent[]> {
  const withoutFinancial = list.filter((log) => !log.financial_records);
  if (withoutFinancial.length === 0) return list;
  const logIds = withoutFinancial.map((l) => l.id);
  const { data: links } = await supabase
    .from("financial_record_class_logs")
    .select("class_log_id, financial_record_id")
    .in("class_log_id", logIds);
  if (!links?.length) return list;
  const frIds = [...new Set(links.map((r) => r.financial_record_id))];
  const { data: frs } = await supabase
    .from("financial_records")
    .select("id, status, amount, due_date, description")
    .in("id", frIds);
  const frMap = new Map((frs ?? []).map((fr) => [fr.id, fr]));
  const logToFr = new Map(links.map((r) => [r.class_log_id, r.financial_record_id]));
  withoutFinancial.forEach((log) => {
    const frId = logToFr.get(log.id);
    const fr = frId ? frMap.get(frId) : null;
    if (fr) {
      (log as ClassLogWithStudent).financial_records = fr;
      (log as ClassLogWithStudent).financial_record_via_package = true;
    }
  });
  return list;
}

/** Busca aulas por lista de student_ids (ex.: para enriquecer lista paginada de alunos) */
export function useClassLogsByStudentIds(studentIds: string[]) {
  return useQuery({
    queryKey: ["class_logs_by_student_ids", studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [] as ClassLogWithStudent[];
      const { data, error } = await supabase
        .from("class_logs")
        .select(`
          *,
          students ( name, teacher_id ),
          teachers ( name ),
          financial_records ( id, status, amount, due_date )
        `)
        .in("student_id", studentIds)
        .order("class_date", { ascending: false });
      if (error) throw error;
      const list = (data ?? []) as ClassLogWithStudent[];
      return enrichWithPackageFinancial(list);
    },
    enabled: studentIds.length > 0,
  });
}

/** Aulas em aberto para avaliação (attendance/grade não preenchidos, data já passou). Usado no sino de notificações. Não filtra por teacher_id: RLS já restringe ao professor (só vê aulas dos seus alunos); filtrar por teacher_id excluiria aulas com teacher_id nulo. */
export function usePendingEvaluationClassLogs(teacherId?: string | null) {
  return useQuery({
    queryKey: ["class_logs_pending_evaluation", teacherId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("class_logs")
        .select(`
          *,
          students ( name, teacher_id ),
          teachers ( name ),
          financial_records ( id, status, amount, due_date )
        `)
        .is("attendance", null)
        .lte("class_date", todayStr)
        .order("class_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      const list = (data ?? []) as ClassLogWithStudent[];
      const enriched = await enrichWithPackageFinancial(list);
      return enriched.filter((log) => getClassStatusWithTime(log).label === "Avaliação pendente");
    },
  });
}

// Buscar aulas de um aluno específico que ainda não têm cobrança vinculada
// Opcionalmente pode filtrar por professor (para telas de admin)
export function useAvailableClassLogsForStudent(studentId: string | null, teacherId?: string) {
  return useQuery({
    queryKey: ["available_class_logs", studentId, teacherId],
    queryFn: async () => {
      if (!studentId) return [];

      // Buscar todas as aulas do aluno. Não filtrar por class_logs.teacher_id:
      // o aluno já está definido; se o contexto exige um professor, o student_id já implica alunos desse professor.
      const { data: classLogs, error: classLogsError } = await supabase
        .from("class_logs")
        .select("*")
        .eq("student_id", studentId)
        .order("class_date", { ascending: false });

      if (classLogsError) throw classLogsError;

      // Buscar IDs de aulas que já têm cobrança (direta ou via pacote)
      const { data: financialRecords, error: financialError } = await supabase
        .from("financial_records")
        .select("class_log_id")
        .eq("student_id", studentId)
        .not("class_log_id", "is", null);

      if (financialError) throw financialError;

      const usedClassLogIds = new Set(financialRecords?.map(r => r.class_log_id).filter(Boolean) || []);

      const { data: packageLinks } = await supabase
        .from("financial_record_class_logs")
        .select("class_log_id")
        .in("class_log_id", classLogs?.map((l) => l.id) ?? []);

      packageLinks?.forEach((r) => usedClassLogIds.add(r.class_log_id));

      // Filtrar aulas disponíveis (sem cobrança)
      return classLogs?.filter(log => !usedClassLogIds.has(log.id)) || [];
    },
    enabled: !!studentId,
  });
}

export function useClassLogsSummary(teacherId?: string | null) {
  return useQuery({
    queryKey: ["class_logs_summary", teacherId],
    queryFn: async () => {
      let query = supabase
        .from("class_logs")
        .select("attendance, grade");
      if (teacherId) {
        const { data: teacherStudentIds } = await supabase
          .from("students")
          .select("id")
          .eq("teacher_id", teacherId);
        if (teacherStudentIds && teacherStudentIds.length > 0) {
          query = query.in("student_id", teacherStudentIds.map((s) => s.id));
        } else {
          return {
            totalClasses: 0,
            totalPresent: 0,
            totalAbsent: 0,
            averageGrade: 0,
            gradesCount: 0,
            gradesSum: 0,
          };
        }
      }
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const summary = {
        totalClasses: data.length,
        totalPresent: 0,
        totalAbsent: 0,
        averageGrade: 0,
        gradesCount: 0,
        gradesSum: 0,
      };

      data.forEach((log) => {
        if (log.attendance) {
          summary.totalPresent++;
        } else {
          summary.totalAbsent++;
        }
        if (log.grade !== null) {
          summary.gradesSum += Number(log.grade);
          summary.gradesCount++;
        }
      });

      if (summary.gradesCount > 0) {
        summary.averageGrade = summary.gradesSum / summary.gradesCount;
      }

      return summary;
    },
  });
}

export function useCreateClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: ClassLogInsert) => {
      const overlap = await checkClassOverlap(
        log.teacher_id,
        log.class_date,
        log.start_at,
        log.end_at
      );
      if (overlap.overlap) {
        throw new Error(overlap.message);
      }
      const { data, error } = await supabase
        .from("class_logs")
        .insert(log)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      toast.success("Aula registrada com sucesso!");
    },
    onError: (error) => {
      const msg = (error as Error)?.message || "";
      const code = (error as { code?: string })?.code;
      const isOverlap =
        code === "23P01" ||
        msg.includes("neste horário") ||
        msg.includes("sobreposição") ||
        msg.includes("overlap") ||
        msg.includes("class_logs_no_overlap") ||
        msg.includes("exclusion constraint") ||
        msg.includes("conflicting key");
      toast.error(
        isOverlap
          ? "Já existe outra aula neste horário para este professor. Escolha outro intervalo."
          : "Erro ao registrar aula. Tente novamente."
      );
    },
  });
}

export function useCreateClassLogWithFinancial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ classLog, createFinancial, financialData }: ClassLogWithFinancialData) => {
      // Permite cobrança para aulas agendadas (futuras): professor pode deixar em aberto
      // antes da aula; presença e feedback são marcados depois.

      const overlap = await checkClassOverlap(
        classLog.teacher_id,
        classLog.class_date,
        classLog.start_at,
        classLog.end_at
      );
      if (overlap.overlap) {
        throw new Error(overlap.message);
      }

      // Primeiro cria a aula
      const { data: createdLog, error: logError } = await supabase
        .from("class_logs")
        .insert(classLog)
        .select()
        .single();

      if (logError) {
        throw logError;
      }

      // Se deve criar cobrança, cria vinculada à aula.
      // financialData.amount = classLog.billed_amount ?? (hourly_rate * duration_minutes/60) — calculado no frontend.
      if (createFinancial && financialData) {
        const [y, m, d] = (classLog.class_date || "").split("-");
        const defaultDescription =
          y && m && d ? `Aula do dia ${d}/${m}/${y}` : `Aula do dia ${classLog.class_date || ""}`;
        const description =
          (typeof financialData.description === "string" && financialData.description.trim())
            ? financialData.description.trim()
            : defaultDescription;

        const { error: financialError } = await supabase
          .from("financial_records")
          .insert({
            student_id: classLog.student_id,
            class_log_id: createdLog.id,
            amount: financialData.amount,
            due_date: financialData.due_date,
            description,
            payment_method: financialData.payment_method || null,
            status: "pendente",
          });

        if (financialError) {
          // Se falhar ao criar cobrança, ainda retorna a aula criada
          toast.error("Aula criada, mas erro ao criar cobrança.");
          return createdLog;
        }
      }

      return createdLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["available_class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });

      if (variables.createFinancial) {
        toast.success("Aula e cobrança registradas com sucesso!");
      } else {
        toast.success("Aula registrada com sucesso!");
      }
    },
    onError: (error) => {
      const msg = (error as Error)?.message || "";
      const code = (error as { code?: string })?.code;
      const isOverlap =
        code === "23P01" ||
        msg.includes("neste horário") ||
        msg.includes("sobreposição") ||
        msg.includes("overlap") ||
        msg.includes("class_logs_no_overlap") ||
        msg.includes("exclusion constraint") ||
        msg.includes("conflicting key");
      toast.error(
        isOverlap
          ? "Já existe outra aula neste horário para este professor. Escolha outro intervalo."
          : "Erro ao registrar aula. Tente novamente."
      );
    },
  });
}

export type UpdateClassLogPayload = ClassLogUpdate & {
  id: string;
  financialRecordId?: string;
  dueDate?: string;
  amount?: number;
};

export function useUpdateClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, financialRecordId, dueDate, amount, ...updates }: UpdateClassLogPayload) => {
      const hasTimeChange = "start_at" in updates || "end_at" in updates || "class_date" in updates || "teacher_id" in updates;
      if (hasTimeChange) {
        const { data: current } = await supabase.from("class_logs").select("teacher_id, class_date, start_at, end_at").eq("id", id).single();
        const teacherId = updates.teacher_id ?? (current?.teacher_id ?? null);
        const classDate = updates.class_date ?? (current?.class_date ?? null);
        const startAt = updates.start_at ?? (current?.start_at ?? null);
        const endAt = updates.end_at ?? (current?.end_at ?? null);
        if (teacherId && classDate && startAt && endAt) {
          const overlap = await checkClassOverlap(teacherId, classDate, startAt, endAt, id);
          if (overlap.overlap) throw new Error(overlap.message);
        }
      }
      const { data, error } = await supabase
        .from("class_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (financialRecordId) {
        const financialUpdate: { due_date?: string; amount?: number } = {};
        if (dueDate) financialUpdate.due_date = dueDate;
        if (amount != null && amount > 0) financialUpdate.amount = amount;
        if (Object.keys(financialUpdate).length > 0) {
          const { error: financialError } = await supabase
            .from("financial_records")
            .update(financialUpdate)
            .eq("id", financialRecordId);
          if (financialError) {
            toast.error("Aula atualizada, mas não foi possível atualizar a cobrança.");
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_pending_evaluation"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      toast.success("Registro atualizado com sucesso!");
    },
    onError: (error) => {
      const msg = (error as Error)?.message || "";
      const code = (error as { code?: string })?.code;
      const isOverlap =
        code === "23P01" ||
        msg.includes("neste horário") ||
        msg.includes("sobreposição") ||
        msg.includes("overlap") ||
        msg.includes("class_logs_no_overlap") ||
        msg.includes("exclusion constraint") ||
        msg.includes("conflicting key");
      toast.error(
        isOverlap
          ? "Já existe outra aula neste horário para este professor. Escolha outro intervalo."
          : "Erro ao atualizar registro. Tente novamente."
      );
    },
  });
}

/** Payload para criar um pacote de aulas em lote */
export interface CreateClassLogPackageItem {
  classLog: ClassLogInsert;
}

/** Cobrança única do pacote (uma linha no financeiro; aulas vinculadas via financial_record_class_logs) */
export interface PackageFinancialData {
  amount: number;
  due_date: string;
  description: string;
  payment_method: string | null;
}

export interface CreateClassLogPackagePayload {
  items: CreateClassLogPackageItem[];
  packageFinancial?: PackageFinancialData | null;
}

export function useCreateClassLogPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateClassLogPackagePayload) => {
      const { items, packageFinancial } = payload;
      if (items.length === 0) throw new Error("Nenhuma aula no pacote.");

      // Verificar sobreposição de cada aula com as existentes e entre si
      for (let i = 0; i < items.length; i++) {
        const { classLog } = items[i];
        const overlap = await checkClassOverlap(
          classLog.teacher_id,
          classLog.class_date,
          classLog.start_at,
          classLog.end_at
        );
        if (overlap.overlap) throw new Error(overlap.message);

        for (let j = i + 1; j < items.length; j++) {
          const other = items[j].classLog;
          if (
            classLog.teacher_id &&
            other.teacher_id === classLog.teacher_id &&
            classLog.class_date === other.class_date &&
            classLog.start_at &&
            classLog.end_at &&
            other.start_at &&
            other.end_at
          ) {
            const start = new Date(classLog.start_at).getTime();
            const end = new Date(classLog.end_at).getTime();
            const oStart = new Date(other.start_at).getTime();
            const oEnd = new Date(other.end_at).getTime();
            if (start < oEnd && oStart < end) {
              throw new Error(
                "Duas aulas do pacote têm o mesmo professor e horários que se sobrepõem. Ajuste as datas/horários."
              );
            }
          }
        }
      }

      const insertPayload = items.map((it) => {
        const tid = it.classLog.teacher_id;
        return {
          ...it.classLog,
          teacher_id: tid != null && String(tid).trim() !== "" ? tid : null,
        };
      });
      const { data: insertedLogs, error: insertError } = await supabase
        .from("class_logs")
        .insert(insertPayload)
        .select("id, student_id, class_date, start_at");

      if (insertError) throw insertError;
      if (!insertedLogs || insertedLogs.length !== items.length) {
        throw new Error("Erro ao criar registros de aula.");
      }

      if (packageFinancial && packageFinancial.amount > 0) {
        const studentId = insertedLogs[0]?.student_id;
        if (!studentId) throw new Error("Erro ao obter aluno do pacote.");
        
        // Avoid relying on RETURNING/select() after insert due to RLS issues.
        // Insert the financial record without select, then query it back.
        const { error: frError } = await supabase
          .from("financial_records")
          .insert({
            student_id: studentId,
            class_log_id: null,
            amount: packageFinancial.amount,
            due_date: packageFinancial.due_date,
            description: packageFinancial.description?.trim() || `Pacote mensal - ${items.length} aulas`,
            payment_method: packageFinancial.payment_method ?? null,
            status: "pendente",
          });
        
        if (frError) {
          toast.error(`Aulas criadas, erro ao criar cobrança: ${frError.message}`);
          return insertedLogs;
        }
        
        // Query back the financial record we just created
        // Use a small delay to ensure the insert is committed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: financialRecord, error: queryError } = await supabase
          .from("financial_records")
          .select("id")
          .eq("student_id", studentId)
          .eq("amount", packageFinancial.amount)
          .eq("due_date", packageFinancial.due_date)
          .is("class_log_id", null)
          .eq("status", "pendente")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (queryError) {
          toast.error(`Cobrança pode ter sido criada, erro ao buscar: ${queryError.message}`);
          return insertedLogs;
        }
        
        if (!financialRecord?.id) {
          toast.error("Cobrança pode ter sido criada mas não foi encontrada. Verifique a aba Financeiro.");
          return insertedLogs;
        }
        
        // Link the classes to the package financial record
        const links = insertedLogs.map((log) => ({
          financial_record_id: financialRecord.id,
          class_log_id: log.id,
        }));
        
        const { error: linkError } = await supabase
          .from("financial_record_class_logs")
          .insert(links);
        
        if (linkError) {
          toast.error(`Aulas e cobrança criadas, erro ao vincular: ${linkError.message}`);
        }
      }

      return insertedLogs;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["available_class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      const withFinancial = !!variables.packageFinancial;
      toast.success(
        `${variables.items.length} aula(s) registrada(s)${withFinancial ? " com cobrança do pacote" : ""} com sucesso!`
      );
    },
    onError: (error) => {
      const err = error as Error & { details?: string; code?: string };
      const msg = err?.message || "";
      const details = err?.details ? ` (${err.details})` : "";
      const isOverlap =
        msg.includes("neste horário") ||
        msg.includes("sobrepõem") ||
        msg.includes("overlap") ||
        msg.includes("Duas aulas");
      const displayMsg = isOverlap ? msg : (msg ? `${msg}${details}` : "Erro ao cadastrar pacote de aulas. Tente novamente.");
      toast.error(displayMsg);
    },
  });
}

export function useDeleteClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Exclui a cobrança vinculada (se existir) antes de excluir a aula
      await supabase
        .from("financial_records")
        .delete()
        .eq("class_log_id", id);

      const { error } = await supabase
        .from("class_logs")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Registro removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover registro. Tente novamente.");
    },
  });
}
