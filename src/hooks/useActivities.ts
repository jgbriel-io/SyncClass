import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

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

/** Upload de arquivo para o Supabase Storage */
export async function uploadActivityFile(file: File): Promise<{ path: string; url: string }> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("activities")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error("Erro ao fazer upload do arquivo: " + uploadError.message);
  }

  // Para buckets privados, armazenamos apenas o path
  // A URL será gerada quando necessário via signed URL
  return {
    path: filePath,
    url: filePath, // Armazenamos o path, não a URL
  };
}

/** Download/visualização de arquivo - gera signed URL temporária (válida por 1 hora) */
export async function getActivityFileUrl(filePathOrUrl: string): Promise<string> {
  // Extrair apenas o nome do arquivo se for uma URL completa
  let filePath = filePathOrUrl;
  
  // Se for uma URL do Supabase, extrair apenas o path
  if (filePathOrUrl.includes('supabase.co/storage/v1/object/public/activities/')) {
    filePath = filePathOrUrl.split('activities/').pop() || filePathOrUrl;
  } else if (filePathOrUrl.includes('supabase.co/storage/v1/object/sign/activities/')) {
    filePath = filePathOrUrl.split('activities/').pop()?.split('?')[0] || filePathOrUrl;
  }

  // Tentar criar signed URL
  const { data, error } = await supabase.storage
    .from("activities")
    .createSignedUrl(filePath, 3600); // 1 hora

  if (error) {
    console.error("Erro ao criar signed URL:", error);
    console.error("Path usado:", filePath);
    console.error("URL/Path original:", filePathOrUrl);
    
    // Se o arquivo não existe, verificar se há problema com o path
    if (error.message.includes("not found") || error.message.includes("Object not found")) {
      throw new Error(`Arquivo não encontrado no storage. Verifique se o arquivo "${filePath}" existe no bucket 'activities'.`);
    }
    
    throw new Error("Erro ao gerar URL do arquivo: " + error.message);
  }

  return data.signedUrl;
}

/** Arquivo já usado em alguma atividade (para reutilizar no envio) */
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

/** Listar atividades (professor ou aluno) */
export function useActivities(teacherId?: string, studentId?: string) {
  return useQuery({
    queryKey: ["activities", teacherId, studentId],
    queryFn: async () => {
      let query = supabase
        .from("activities")
        .select(`
          *,
          students (name),
          teachers (name)
        `)
        .order("created_at", { ascending: false });

      if (teacherId) {
        query = query.eq("teacher_id", teacherId);
      }

      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as ActivityWithRelations[];
    },
    enabled: !!(teacherId || studentId),
  });
}

/** Criar atividade (professor) */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: ActivityInsert) => {
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
      toast.error("Erro ao enviar atividade: " + (error as Error).message);
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
      toast.error("Erro ao atualizar atividade: " + (error as Error).message);
    },
  });
}

/** Marcar atividade como entregue (aluno) */
export function useMarkActivityAsDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      responseText,
      responseFileUrl,
      responseFileName,
    }: {
      activityId: string;
      responseText?: string;
      responseFileUrl?: string;
      responseFileName?: string;
    }) => {
      const { data, error } = await supabase
        .from("activities")
        .update({
          status: "entregue",
          delivered_at: new Date().toISOString(),
          student_response_text: responseText || null,
          student_response_file_url: responseFileUrl || null,
          student_response_file_name: responseFileName || null,
        })
        .eq("id", activityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade marcada como entregue!");
    },
    onError: (error) => {
      toast.error("Erro ao marcar atividade: " + (error as Error).message);
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
      toast.error("Erro ao enviar correção: " + (error as Error).message);
    },
  });
}

/** Deletar atividade (professor) */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Atividade excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir atividade: " + (error as Error).message);
    },
  });
}
