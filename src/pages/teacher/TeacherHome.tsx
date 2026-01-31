import { DashboardView } from "@/components/dashboard/DashboardView";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useTeacherDashboardStats,
  useTeacherUpcomingPayments,
  useTeacherBirthdaysThisMonth,
  useTeacherNewStudentsByMonth,
} from "@/hooks/useTeacherDashboard";

const TeacherHome = () => {
  const { user } = useAuth();
  
  // Get teacher_id from profile
  const { data: teacherProfile } = useQuery({
    queryKey: ["teacher-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("teacher_id")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const teacherId = teacherProfile?.teacher_id;

  const { data: stats, isLoading: loadingStats } = useTeacherDashboardStats(teacherId);
  const { data: upcomingPayments = [], isLoading: loadingPayments } = useTeacherUpcomingPayments(teacherId);
  const { data: birthdays = [], isLoading: loadingBirthdays } = useTeacherBirthdaysThisMonth(teacherId);
  const { data: chartData = [], isLoading: loadingChart } = useTeacherNewStudentsByMonth(teacherId);

  const isLoading = loadingStats || loadingPayments || loadingBirthdays || loadingChart || !teacherId;

  return (
    <DashboardView
        title="Dashboard"
        subtitle="Bem-vindo de volta! Aqui está o resumo dos seus alunos."
        stats={stats}
        upcomingPayments={upcomingPayments}
        birthdays={birthdays}
        chartData={chartData}
        isLoading={isLoading}
        basePath="/teacher"
      />
  );
};

export default TeacherHome;
