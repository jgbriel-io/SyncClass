import { DashboardView } from "@/components/dashboard/DashboardView";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";
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
import {
  type PeriodFilter,
  getDateRangeForPeriod,
} from "@/lib/utils/periodFilter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [chartMonths, setChartMonths] = useState<ChartMonthsFilter>(3);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const { data: profile } = useCurrentUserProfile(user?.id);
  const dateRange = getDateRangeForPeriod(periodFilter);

  const { data: stats, isLoading: loadingStats } =
    useDashboardStats(periodFilter);
  const { data: financialSummary, isLoading: loadingFinancial } =
    useFinancialSummary(undefined, dateRange);
  const { data: forecastedBilling } = useForecastedBilling(
    undefined,
    dateRange
  );
  const { data: upcomingPayments = [], isLoading: loadingPayments } =
    useUpcomingPayments();
  const { data: birthdays = [], isLoading: loadingBirthdays } =
    useBirthdaysThisMonth();
  const { data: chartData = [], isLoading: loadingChart } =
    useNewStudentsByMonth(chartMonths);
  const { data: todayClasses } = useTodayClasses(null);
  const { data: pendingEvaluationLogs = [] } =
    usePendingEvaluationClassLogs(null);

  const isLoading =
    loadingStats || loadingFinancial || loadingPayments || loadingBirthdays;
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
      periodFilter={periodFilter}
      onPeriodFilterChange={setPeriodFilter}
    />
  );
}
