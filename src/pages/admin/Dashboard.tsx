import { DashboardView } from "@/components/dashboard/DashboardView";
import {
  useDashboardStats,
  useUpcomingPayments,
  useBirthdaysThisMonth,
  useNewStudentsByMonth,
} from "@/hooks/useDashboardStats";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: upcomingPayments = [], isLoading: loadingPayments } = useUpcomingPayments();
  const { data: birthdays = [], isLoading: loadingBirthdays } = useBirthdaysThisMonth();
  const { data: chartData = [], isLoading: loadingChart } = useNewStudentsByMonth();

  const isLoading = loadingStats || loadingPayments || loadingBirthdays || loadingChart;

  return (
    <DashboardView
        title="Dashboard"
        subtitle="Bem-vindo de volta! Aqui está o resumo da sua instituição."
        stats={stats}
        upcomingPayments={upcomingPayments}
        birthdays={birthdays}
        chartData={chartData}
        isLoading={isLoading}
        basePath="/admin"
      />
  );
}
