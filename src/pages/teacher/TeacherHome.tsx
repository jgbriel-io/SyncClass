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

const TeacherHome = () => {
  const { teacherId, fullName } = useTeacherId();
  const [chartMonths, setChartMonths] = useState<ChartMonthsFilter>(3);
  const displayName = fullName?.trim() || "Professor";

  const { data: stats, isLoading: loadingStats } = useTeacherDashboardStats(teacherId);
  const { data: financialSummary, isLoading: loadingFinancial } = useFinancialSummary(teacherId ?? undefined);
  const { data: forecastedBilling } = useForecastedBilling(teacherId ?? undefined);
  const { data: upcomingPayments = [], isLoading: loadingPayments } = useTeacherUpcomingPayments(teacherId);
  const { data: birthdays = [], isLoading: loadingBirthdays } = useTeacherBirthdaysThisMonth(teacherId);
  const { data: chartData = [], isLoading: loadingChart } = useTeacherNewStudentsByMonth(teacherId, chartMonths);
  const { data: todayClasses } = useTodayClasses(teacherId);
  const { data: pendingEvaluationLogs = [] } = usePendingEvaluationClassLogs(teacherId ?? null);

  const isLoading = loadingStats || loadingFinancial || loadingPayments || loadingBirthdays || !teacherId;

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
      />
  );
};

export default TeacherHome;
