import { DashboardView } from "@/components/dashboard/DashboardView";
import { useState } from "react";
import { useTeacherId } from "@/hooks/useTeacherId";
import {
  useTeacherDashboardStats,
  useTeacherUpcomingPayments,
  useTeacherBirthdaysThisMonth,
  useTeacherNewStudentsByMonth,
} from "@/hooks/useTeacherDashboard";
import { useFinancialSummary } from "@/hooks/useFinancialRecords";
import { useForecastedBilling } from "@/hooks/useForecastedBilling";
import { useTodayClasses } from "@/hooks/useTodayClasses";
import { usePendingEvaluationClassLogs } from "@/hooks/useClassLogs";
import type { ChartMonthsFilter } from "@/components/dashboard/DashboardGrowthChart";
import {
  type PeriodFilter,
  getDateRangeForPeriod,
} from "@/lib/utils/periodFilter";

const TeacherHome = () => {
  const { teacherId, fullName } = useTeacherId();
  const [chartMonths, setChartMonths] = useState<ChartMonthsFilter>(3);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const displayName = fullName?.trim() || "Professor";
  const dateRange = getDateRangeForPeriod(periodFilter);

  const { data: stats, isLoading: loadingStats } = useTeacherDashboardStats(
    teacherId,
    periodFilter
  );
  const { data: financialSummary, isLoading: loadingFinancial } =
    useFinancialSummary(teacherId ?? undefined, dateRange);
  const { data: forecastedBilling } = useForecastedBilling(
    teacherId ?? undefined,
    dateRange
  );
  const { data: upcomingPayments = [], isLoading: loadingPayments } =
    useTeacherUpcomingPayments(teacherId);
  const { data: birthdays = [], isLoading: loadingBirthdays } =
    useTeacherBirthdaysThisMonth(teacherId);
  const { data: chartData = [], isLoading: loadingChart } =
    useTeacherNewStudentsByMonth(teacherId, chartMonths);
  const { data: todayClasses } = useTodayClasses(teacherId);
  const { data: pendingEvaluationLogs = [] } = usePendingEvaluationClassLogs(
    teacherId ?? null
  );

  const isLoading =
    loadingStats ||
    loadingFinancial ||
    loadingPayments ||
    loadingBirthdays ||
    !teacherId;

  return (
    <DashboardView
      title="Dashboard"
      subtitle={`Bem-vindo de volta, ${displayName}! Aqui está o resumo dos seus alunos.`}
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
      basePath="/teacher"
      chartMonths={chartMonths}
      onChartMonthsChange={setChartMonths}
      periodFilter={periodFilter}
      onPeriodFilterChange={setPeriodFilter}
    />
  );
};

export default TeacherHome;
