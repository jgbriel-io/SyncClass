import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/utils/errorMessages";
import { logError } from "@/lib/security/errorHandler";
import { logger } from "@/lib/sentry";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rateLimit";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import {
  formatActivityDueDate,
  getActivityDisplayStatus,
  uploadActivityFile,
  getActivityFileUrl,
  fetchActivities,
} from "./activitiesService";

export { formatActivityDueDate, getActivityDisplayStatus, uploadActivityFile, getActivityFileUrl };

export type Activity = Tables<"activities">;
export type ActivityInsert = TablesInsert<"activities">;
export type ActivityUpdate = TablesUpdate<"activities">;

export interface ActivityWithRelations extends Activity {
  students: {
    name: string;
  } | null;
  teachers: {
    name: string;
  } | null;
}

/** Opções para listagem: fetchAll = true (admin) busca todas as atividades da plataforma */
export type UseActivitiesOptions = { fetchAll?: boolean };
export interface ActivityFileOption {
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
}

/** Lista de arquivos distintos já enviados pelo professor (para seleção "arquivo da plataforma") */
export function useActivityFilesForTeacher(teacherId: string | undefined) {
  const { data: activities = [], ...rest } = useActivities(teacherId, undefined);
  const files = useMemo(() => {
    const seen = new Set<string>();
    const list: ActivityFileOption[] = [];
    for (const a of activities) {
      if (a.file_url && !seen.has(a.file_url)) {
        seen.add(a.file_url);
        list.push({
          file_url: a.file_url,
          file_name: a.file_name,
          file_type: a.file_type ?? null,
          file_size: a.file_size ?? null,
        });
      }
    }
    return list;
  }, [activities]);
  return { data: files, ...rest };
}

/** Lista de arquivos distintos de TODOS os professores (para admin) */
export function useAllActivityFiles() {
  const { data: activities = [], ...rest } = useActivities(undefined, undefined, { fetchAll: true });
  const files = useMemo(() => {
    const seen = new Set<string>();
    const list: ActivityFileOption[] = [];
    for (const a of activities) {
      // Apenas arquivos principais (file_url), nunca arquivos de resposta de alunos
      if (a.file_url && !seen.has(a.file_url)) {
        seen.add(a.file_url);
        list.push({
          file_url: a.file_url,
          file_name: a.file_name,
          file_type: a.file_type ?? null,
          file_size: a.file_size ?? null,
        });
      }
    }
    return list;
  }, [activities]);
  return { data: files, ...rest };
}

/** Opções para listagem: fetchAll = true (admin) busca todas as atividades da plataforma */
export type UseActivitiesOptions = { fetchAll?: boolean };

/** Listar atividades (professor, aluno ou admin) */
export function useActivities(
  teacherId?: string,
  studentId?: string,
  options?: UseActivitiesOptions
) {
  const fetchAll = options?.fetchAll === true;
  return useQuery({
    queryKey: ["activities", teacherId, studentId, fetchAll],
    queryFn: () => fetchActivities(teacherId, studentId, fetchAll),
    enabled: fetchAll || !!teacherId || !!studentId,
  });
}

/** Criar atividade (professor) */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: ActivityInsert) => {
      // Rate limiting: 10 chamadas por minuto
      const rateLimitResult = checkRateLimit("createActivity", RATE_LIMIT_CONFIGS.NORMAL);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Muitas requisições. Aguarde ${rateLimitResult.retryAfter} segundo(s) antes de tentar novamente.`
        );
      }

      const { data, error } = await supabase
        .from("activities")
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade enviada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useCreateActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

/** Atualizar atividade (feedback/correção) */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ActivityUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("activities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade atualizada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

/** Marcar atividade como entregue (aluno) */
export function useMarkActivityAsDelivered() {
  return useOptimisticMutation<Activity, {
    activityId: string;
    responseText?: string;
    responseFileUrl?: string;
    responseFileName?: string;
  }>({
    mutationFn: async ({
      activityId,
      responseText,
      responseFileUrl,
      responseFileName,
    }) => {
      const { data, error } = await supabase
        .from("activities")
        .update({
          status: "entregue",
          delivered_at: new Date().toISOString(),
          student_response_text: responseText || null,
          response_file_url: responseFileUrl || null,
          response_file_name: responseFileName || null,
        })
        .eq("id", activityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    queryKey: ["activities"],
    optimisticUpdate: (oldData: ActivityWithRelations[], { activityId }) => {
      return oldData.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              status: "entregue" as const,
              delivered_at: new Date().toISOString(),
            }
          : activity
      );
    },
    successMessage: "Atividade marcada como entregue!",
    errorMessage: "Erro ao marcar atividade como entregue",
    onError: (error) => {
      logger.error(error, { context: "useMarkActivityAsDelivered" });
    },
  });
}

/** Adicionar correção/feedback (professor) */
export function useAddActivityCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      feedback,
      grade,
      correctionFileUrl,
      correctionFileName,
    }: {
      activityId: string;
      feedback?: string;
      grade?: number | null;
      correctionFileUrl?: string;
      correctionFileName?: string;
    }) => {
      const { data, error } = await supabase
        .from("activities")
        .update({
          status: "corrigida",
          feedback: feedback || null,
          grade: grade != null ? grade : null,
          correction_file_url: correctionFileUrl || null,
          correction_file_name: correctionFileName || null,
          corrected_at: new Date().toISOString(),
        })
        .eq("id", activityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Correção enviada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useAddActivityCorrection" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

/** Deletar atividade (professor) */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      // Soft delete: marcar como deletado em vez de remover do banco
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("activities")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id || null,
        })
        .eq("id", activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade excluída com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useDeleteActivity" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
