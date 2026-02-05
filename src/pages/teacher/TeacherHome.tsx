import { DashboardView } from "@/components/dashboard/DashboardView";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useTeacherDashboardStats,
  useTeacherUpcomingPayments,
  useTeacherBirthdaysThisMonth,
  useTeacherNewStudentsByMonth,
} from "@/hooks/useTeacherDashboard";
import { useFinancialSummary } from "@/hooks/useFinancialRecords";
import { useTodayClasses } from "@/hooks/useTodayClasses";
import type { ChartMonthsFilter } from "@/components/dashboard/DashboardView";

const TeacherHome = () => {
  const { user } = useAuth();
  const [chartMonths, setChartMonths] = useState<ChartMonthsFilter>(3);
  
  // Get teacher_id and display name from profile
  const { data: teacherProfile } = useQuery({
    queryKey: ["teacher-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("teacher_id, full_name")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const teacherId = teacherProfile?.teacher_id;
  const displayName = teacherProfile?.full_name?.trim() || "Professor";

  const { data: stats, isLoading: loadingStats } = useTeacherDashboardStats(teacherId);
  const { data: financialSummary, isLoading: loadingFinancial } = useFinancialSummary(teacherId ?? undefined);
  const { data: upcomingPayments = [], isLoading: loadingPayments } = useTeacherUpcomingPayments(teacherId);
  const { data: birthdays = [], isLoading: loadingBirthdays } = useTeacherBirthdaysThisMonth(teacherId);
  const { data: chartData = [], isLoading: loadingChart } = useTeacherNewStudentsByMonth(teacherId, chartMonths);
  const { data: todayClasses } = useTodayClasses(teacherId);

  const isLoading = loadingStats || loadingFinancial || loadingPayments || loadingBirthdays || !teacherId;

  return (
    <DashboardView
        title="Dashboard"
        subtitle={`Bem-vindo de volta, ${displayName}! Aqui está o resumo dos seus alunos.`}
        stats={stats}
        financialSummary={financialSummary}
        upcomingPayments={upcomingPayments}
        birthdays={birthdays}
        chartData={chartData}
        todayClasses={todayClasses}
        isLoading={isLoading}
        chartLoading={loadingChart}
        basePath="/teacher"
        chartMonths={chartMonths}
        onChartMonthsChange={setChartMonths}
      />
  );
};

export default TeacherHome;
