import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type ClassLog = Tables<"class_logs">;
export type ClassLogInsert = TablesInsert<"class_logs">;
export type ClassLogUpdate = TablesUpdate<"class_logs">;

export interface ClassLogWithStudent extends ClassLog {
  students: {
    name: string;
  } | null;
}

export function useClassLogs() {
  return useQuery({
    queryKey: ["class_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_logs")
        .select(`
          *,
          students (
            name
          )
        `)
        .order("class_date", { ascending: false });

      if (error) {
        throw error;
      }

      return data as ClassLogWithStudent[];
    },
  });
}

export function useClassLogsSummary() {
  return useQuery({
    queryKey: ["class_logs_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_logs")
        .select("attendance, grade");

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
      toast.error("Erro ao registrar aula. Tente novamente.");
    },
  });
}

export function useUpdateClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClassLogUpdate & { id: string }) => {
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
      toast.error("Erro ao atualizar registro. Tente novamente.");
    },
  });
}

export function useDeleteClassLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
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
      toast.success("Registro removido com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting class log:", error);
      toast.error("Erro ao remover registro. Tente novamente.");
    },
  });
}
