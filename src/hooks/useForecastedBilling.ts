import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "./queryKeys";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { isOverdue } from "@/lib/utils/financialStatus";

export interface ForecastedBilling {
  /** Previsão total do mês (soma de todas as cobranças do mês, independente do status) */
  totalForecast: number;
  /** Já recebido no mês */
  receivedThisMonth: number;
  /** Ainda a receber no mês (pendente + atrasado com vencimento no mês) */
  pendingThisMonth: number;
  /** Percentual já recebido */
  receivedPercentage: number;
  /** Quantidade total de cobranças no mês */
  totalCount: number;
  /** Quantidade já paga */
  paidCount: number;
}

/**
 * Hook que calcula a previsão de faturamento do mês corrente.
 *
 * Considera todas as cobranças com `due_date` dentro do mês atual,
 * independentemente do status (pendente, pago, atrasado).
 *
 * @param teacherId - Se informado, filtra apenas cobranças de alunos desse professor.
 */
export function useForecastedBilling(
  teacherId?: string | null,
  dateRange?: { from: string; to: string }
) {
  return useQuery({
    queryKey: [
      QK.FORECASTED_BILLING,
      teacherId,
      dateRange?.from,
      dateRange?.to,
    ],
    queryFn: async (): Promise<ForecastedBilling> => {
      const now = new Date();
      const rangeFrom =
        dateRange?.from ?? format(startOfMonth(now), "yyyy-MM-dd");
      const rangeTo = dateRange?.to ?? format(endOfMonth(now), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("financial_records")
        .select("amount, status, due_date, students(teacher_id)")
        .gte("due_date", rangeFrom)
        .lte("due_date", rangeTo);

      if (error) throw error;

      let records = (data || []) as Array<{
        amount: number;
        status: string;
        due_date: string;
        students?: { teacher_id?: string } | null;
      }>;

      // Filtra por professor, se necessário
      if (teacherId) {
        records = records.filter((r) => r.students?.teacher_id === teacherId);
      }

      let receivedThisMonth = 0;
      let pendingThisMonth = 0;
      let totalForecast = 0;
      let paidCount = 0;

      records.forEach((record) => {
        const amount = Number(record.amount) || 0;
        totalForecast += amount;

        if (record.status === "pago") {
          receivedThisMonth += amount;
          paidCount++;
        } else {
          pendingThisMonth += amount;
        }
      });

      const receivedPercentage =
        totalForecast > 0
          ? Math.round((receivedThisMonth / totalForecast) * 100)
          : 0;

      return {
        totalForecast,
        receivedThisMonth,
        pendingThisMonth,
        receivedPercentage,
        totalCount: records.length,
        paidCount,
      };
    },
  });
}
