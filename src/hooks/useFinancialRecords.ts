import React from "react";

// Hook para desfazer pagamento de uma cobrança
export function useUndoFinancialPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Gerar chave de idempotência usando crypto.randomUUID()
      const idempotencyKey = crypto.randomUUID();

      // Chamar RPC undo_payment_idempotent
      const { data, error } = await supabase.rpc("undo_payment_idempotent", {
        p_record_id: id,
        p_idempotency_key: idempotencyKey,
      });

      if (error) {
        throw error;
      }

      // Verificar se houve erro na resposta do RPC
      if (data && !data.success) {
        throw new Error(data.error || "Erro ao desfazer pagamento");
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Cobrança desfeita com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useUndoFinancialPayment" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/utils/errorMessages";
import { logger } from "@/lib/logger";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import {
  fetchFinancialRecordsByStudentIds,
  fetchFinancialRecords,
  fetchFinancialSummary,
  createFinancialRecordFn,
  updateFinancialRecordFn,
  updateFinancialStatusFn,
  deleteFinancialRecordFn,
} from "./financialRecordsService";

const DEFAULT_PAGE_SIZE = 10;

export type FinancialRecordsFilters = {
  dateFrom?: string;
  dateTo?: string;
  studentId?: string;
  sortBy?: "due_desc" | "due_asc" | "amount_desc" | "amount_asc" | "created_desc" | "created_asc";
};

export type FinancialRecord = Tables<"financial_records">;
export type FinancialRecordInsert = TablesInsert<"financial_records">;
export type FinancialRecordUpdate = TablesUpdate<"financial_records">;

export interface FinancialRecordWithRelations extends FinancialRecord {
  students: {
    name: string;
    teacher_id?: string | null;
  } | null;
  class_logs: {
    id: string;
    class_date: string;
    attendance: boolean | null;
    grade: number | null;
    feedback: string | null;
    title?: string | null;
  } | null;
  confirmed_by?: {
    full_name: string;
  } | null;
  /** Aulas vinculadas quando é uma cobrança de pacote (class_log_id = null) */
  package_classes?: Array<{
    id: string;
    class_date: string;
    title?: string | null;
  }>;
}

export interface UseFinancialRecordsOptions {
  pageSize?: number;
  filters?: FinancialRecordsFilters;
}

export interface UseFinancialRecordsResult {
  data: FinancialRecordWithRelations[];
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
}

/** Busca cobranças por lista de student_ids (ex.: para enriquecer lista paginada de alunos) */
export function useFinancialRecordsByStudentIds(studentIds: string[]) {
  return useQuery({
    queryKey: ["financial_records_by_student_ids", studentIds],
    queryFn: () => fetchFinancialRecordsByStudentIds(studentIds),
    enabled: studentIds.length > 0,
  });
}

export function useFinancialRecords(
  teacherId?: string | null,
  options?: UseFinancialRecordsOptions
): UseFinancialRecordsResult {
  const [page, setPage] = useState(0);
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const filters = options?.filters;

  const query = useQuery({
    queryKey: ["financial_records", teacherId, page, pageSize, filters],
    queryFn: () => fetchFinancialRecords(teacherId, page, pageSize, filters),
    placeholderData: keepPreviousData,
  });

  const list = (query.data?.list ?? []) as FinancialRecordWithRelations[];
  const totalCount = query.data?.count ?? 0;
  const hasMore = totalCount > (page + 1) * pageSize;

  // Reset para página 1 quando a página atual fica vazia mas há dados disponíveis
  React.useEffect(() => {
    if (!query.isLoading && list.length === 0 && totalCount > 0 && page > 0) {
      setPage(0);
    }
  }, [list.length, totalCount, page, query.isLoading]);

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

export function useFinancialSummary(teacherId?: string | null) {
  return useQuery({
    queryKey: ["financial_summary", teacherId],
    queryFn: () => fetchFinancialSummary(teacherId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFinancialRecordFn,
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Cobrança criada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useCreateFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useMarkAsPaid() {
  // Gerar chave de idempotência FORA do mutationFn para evitar race condition
  const idempotencyKeyRef = { current: crypto.randomUUID() };
  
  return useOptimisticMutation<FinancialRecord, string>({
    mutationFn: async (id: string) => {
      // Usar chave fixa para esta instância do hook (evita duplo clique)
      const idempotencyKey = idempotencyKeyRef.current;

      // Chamar RPC mark_as_paid_idempotent
      const { data, error } = await supabase.rpc("mark_as_paid_idempotent", {
        p_record_id: id,
        p_payment_method: null,
        p_idempotency_key: idempotencyKey,
      });

      if (error) {
        throw error;
      }

      // Buscar registro atualizado para retornar
      const { data: record, error: fetchError } = await supabase
        .from("financial_records")
        .select()
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      
      // Gerar nova chave para próxima operação
      idempotencyKeyRef.current = crypto.randomUUID();
      
      return record;
    },
    queryKey: ["financial_records"],
    optimisticUpdate: (oldData: { list: FinancialRecordWithRelations[]; count: number }, id: string) => {
      const now = new Date().toISOString();
      return {
        ...oldData,
        list: oldData.list.map((record) =>
          record.id === id
            ? { ...record, status: "pago" as const, paid_at: now }
            : record
        ),
      };
    },
    successMessage: "Pagamento registrado com sucesso!",
    errorMessage: "Erro ao registrar pagamento",
    onError: (error) => {
      logger.error(error, { context: "useMarkAsPaid" });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  // Gerar chave de idempotência FORA do mutationFn para evitar race condition
  const idempotencyKeyRef = { current: crypto.randomUUID() };
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Usar chave fixa para esta instância do hook (evita duplo clique)
      const idempotencyKey = idempotencyKeyRef.current;

      // Chamar RPC confirm_payment_idempotent
      const { data, error } = await supabase.rpc("confirm_payment_idempotent", {
        p_record_id: id,
        p_idempotency_key: idempotencyKey,
      });

      if (error) {
        throw error;
      }

      // Verificar se houve erro na resposta do RPC
      if (data && !data.success) {
        throw new Error(data.error || "Erro ao confirmar pagamento");
      }

      // Gerar nova chave para próxima operação
      idempotencyKeyRef.current = crypto.randomUUID();

      return data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Pagamento confirmado com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useConfirmPayment" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useUpdateFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFinancialRecordFn,
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Cobrança atualizada com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useUpdateFinancialStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFinancialStatusFn,
    onSuccess: (_, variables) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      
      const message = variables.status === "abonado" 
        ? "Falta abonada (não cobrada)" 
        : "Pagamento extornado";
      toast.success(message);
    },
    onError: (error) => {
      logger.error(error, { context: "useUpdateFinancialStatus" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}

export function useDeleteFinancialRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFinancialRecordFn,
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_records_by_student_ids"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["student_details"] });
      queryClient.invalidateQueries({ queryKey: ["student_balance"] });
      queryClient.invalidateQueries({ queryKey: ["student_statement"] });
      toast.success("Cobrança removida com sucesso!");
    },
    onError: (error) => {
      logger.error(error, { context: "useDeleteFinancialRecord" });
      toast.error(sanitizeErrorMessage(error));
    },
  });
}
