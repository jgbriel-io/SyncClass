import { DashboardView } from "@/components/dashboard/DashboardView";
import { useState } from "react";
import {
  useDashboardStats,
  useUpcomingPayments,
  useBirthdaysThisMonth,
  useNewStudentsByMonth,
} from "@/hooks/useDashboardStats";
import { useFinancialSummary } from "@/hooks/useFinancialRecords";
import { useTodayClasses } from "@/hooks/useTodayClasses";
import type { ChartMonthsFilter } from "@/components/dashboard/DashboardView";

export default function AdminDashboard() {
  const [chartMonths, setChartMonths] = useState<ChartMonthsFilter>(3);

  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: financialSummary, isLoading: loadingFinancial } = useFinancialSummary();
  const { data: upcomingPayments = [], isLoading: loadingPayments } = useUpcomingPayments();
  const { data: birthdays = [], isLoading: loadingBirthdays } = useBirthdaysThisMonth();
  const { data: chartData = [], isLoading: loadingChart } = useNewStudentsByMonth(chartMonths);
  const { data: todayClasses } = useTodayClasses(null);

  const isLoading = loadingStats || loadingFinancial || loadingPayments || loadingBirthdays;

  return (
    <DashboardView
        title="Dashboard"
        subtitle="Bem-vindo de volta! Aqui está o resumo da sua instituição."
        stats={stats}
        financialSummary={financialSummary}
        upcomingPayments={upcomingPayments}
        birthdays={birthdays}
        chartData={chartData}
        todayClasses={todayClasses}
        isLoading={isLoading}
        chartLoading={loadingChart}
        basePath="/admin"
        chartMonths={chartMonths}
        onChartMonthsChange={setChartMonths}
      />
  );
}
