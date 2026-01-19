import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type FinancialRecord = Tables<"financial_records">;
export type FinancialRecordInsert = TablesInsert<"financial_records">;
export type FinancialRecordUpdate = TablesUpdate<"financial_records">;

export interface FinancialRecordWithRelations extends FinancialRecord {
  students: {
    name: string;
  } | null;
  class_logs: {
    id: string;
    class_date: string;
    attendance: boolean | null;
    grade: number | null;
    feedback: string | null;
  } | null;
}

export function useFinancialRecords() {
  return useQuery({
    queryKey: ["financial_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_records")
        .select(`
          *,
          students (
            name
          ),
          class_logs (
            id,
            class_date,
            attendance,
            grade,
            feedback
          )
        `)
        .order("due_date", { ascending: false });

      if (error) {
        throw error;
      }

      return data as FinancialRecordWithRelations[];
    },
  });
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: ["financial_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_records")
        .select("amount, status");

      if (error) {
        throw error;
      }

      const today = new Date();
      
      const summary = {
        totalPending: 0,
        totalPaid: 0,
        totalOverdue: 0,
        countPending: 0,
        countPaid: 0,
        countOverdue: 0,
      };

      data.forEach((record) => {
        const amount = Number(record.amount) || 0;
        if (record.status === "pago") {
          summary.totalPaid += amount;
          summary.countPaid++;
        } else if (record.status === "atrasado") {
          summary.totalOverdue += amount;
          summary.countOverdue++;
        } else {
          summary.totalPending += amount;
          summary.countPending++;
        }
      });

      return summary;
    },
  });
}

export function useCreateFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: FinancialRecordInsert) => {
      const { data, error } = await supabase
        .from("financial_records")
        .insert(record)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      toast.success("Cobrança criada com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating financial record:", error);
      toast.error("Erro ao criar cobrança. Tente novamente.");
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("financial_records")
        .update({
          status: "pago",
          paid_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      toast.success("Pagamento registrado com sucesso!");
    },
    onError: (error) => {
      console.error("Error marking as paid:", error);
      toast.error("Erro ao registrar pagamento. Tente novamente.");
    },
  });
}

export function useUpdateFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: FinancialRecordUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_records")
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
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      toast.success("Cobrança atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating financial record:", error);
      toast.error("Erro ao atualizar cobrança. Tente novamente.");
    },
  });
}

export function useDeleteFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_records")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      toast.success("Cobrança removida com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting financial record:", error);
      toast.error("Erro ao remover cobrança. Tente novamente.");
    },
  });
}
