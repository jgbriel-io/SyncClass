import { DashboardView } from "@/components/dashboard/DashboardView";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  useDashboardStats,
  useUpcomingPayments,
  useBirthdaysThisMonth,
  useNewStudentsByMonth,
} from "@/hooks/useDashboardStats";
import { useFinancialSummary } from "@/hooks/useFinancialRecords";
import { useForecastedBilling } from "@/hooks/useForecastedBilling";
import { useTodayClasses } from "@/hooks/useTodayClasses";
import { usePendingEvaluationClassLogs } from "@/hooks/useClassLogs";
import type { ChartMonthsFilter } from "@/components/dashboard/DashboardGrowthChart";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [chartMonths, setChartMonths] = useState<ChartMonthsFilter>(3);

  const { data: profile } = useQuery({
    queryKey: ["profile-display-name", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: financialSummary, isLoading: loadingFinancial } = useFinancialSummary();
  const { data: forecastedBilling } = useForecastedBilling();
  const { data: upcomingPayments = [], isLoading: loadingPayments } = useUpcomingPayments();
  const { data: birthdays = [], isLoading: loadingBirthdays } = useBirthdaysThisMonth();
  const { data: chartData = [], isLoading: loadingChart } = useNewStudentsByMonth(chartMonths);
  const { data: todayClasses } = useTodayClasses(null);
  const { data: pendingEvaluationLogs = [] } = usePendingEvaluationClassLogs(null);

  const isLoading = loadingStats || loadingFinancial || loadingPayments || loadingBirthdays;
  const displayName = profile?.full_name?.trim() || "Admin";

  return (
      <DashboardView
        title="Dashboard"
        subtitle={`Bem-vindo de volta, ${displayName}! Aqui está o resumo da sua instituição.`}
        stats={stats}
        financialSummary={financialSummary}
        forecastedBilling={forecastedBilling}
        upcomingPayments={upcomingPayments}
        birthdays={birthdays}
        chartData={chartData}
        todayClasses={todayClasses}
        pendingFeedbackCount={pendingEvaluationLogs.length}
        isLoading={isLoading}
        chartLoading={loadingChart}
        basePath="/admin"
        chartMonths={chartMonths}
        onChartMonthsChange={setChartMonths}
      />
  );
}
