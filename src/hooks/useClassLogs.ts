import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

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
  } | null;
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

export function useClassLogs(teacherId?: string) {
  return useQuery({
    queryKey: ["class_logs", teacherId],
    queryFn: async () => {
      let query = supabase
        .from("class_logs")
        .select(`
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
        `)
        .order("class_date", { ascending: false });

      if (teacherId) {
        query = query.eq("teacher_id", teacherId);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return data as ClassLogWithStudent[];
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

      // Buscar todas as aulas do aluno (e, se informado, do professor)
      let classLogsQuery = supabase
        .from("class_logs")
        .select("*")
        .eq("student_id", studentId)
        .order("class_date", { ascending: false });

      if (teacherId) {
        classLogsQuery = classLogsQuery.eq("teacher_id", teacherId);
      }

      const { data: classLogs, error: classLogsError } = await classLogsQuery;

      if (classLogsError) throw classLogsError;

      // Buscar IDs de aulas que já têm cobrança
      const { data: financialRecords, error: financialError } = await supabase
        .from("financial_records")
        .select("class_log_id")
        .eq("student_id", studentId)
        .not("class_log_id", "is", null);

      if (financialError) throw financialError;

      const usedClassLogIds = new Set(financialRecords?.map(r => r.class_log_id) || []);

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
        query = query.eq("teacher_id", teacherId);
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
      console.error("Error creating class log:", error);
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
        const { error: financialError } = await supabase
          .from("financial_records")
          .insert({
            student_id: classLog.student_id,
            class_log_id: createdLog.id,
            amount: financialData.amount, // computedAmount do frontend
            due_date: financialData.due_date,
            description: financialData.description || `Aula do dia ${classLog.class_date}`,
            payment_method: financialData.payment_method || null,
            status: "pendente",
          });

        if (financialError) {
          // Se falhar ao criar cobrança, ainda retorna a aula criada
          console.error("Error creating financial record:", financialError);
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
      queryClient.invalidateQueries({ queryKey: ["available_class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      
      if (variables.createFinancial) {
        toast.success("Aula e cobrança registradas com sucesso!");
      } else {
        toast.success("Aula registrada com sucesso!");
      }
    },
    onError: (error) => {
      console.error("Error creating class log:", error);
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

export function useUpdateClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClassLogUpdate & { id: string }) => {
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

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
      toast.success("Registro atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating class log:", error);
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
    onError: (error) => {
      console.error("Error deleting class log:", error);
      toast.error("Erro ao remover registro. Tente novamente.");
    },
  });
}
