import { OverviewView } from "@/components/overview/OverviewView";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function TeacherOverviewPage() {
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

  return (
    <OverviewView
      title="Visão Geral dos Alunos"
      subtitle="Estatísticas dos seus alunos"
      showTeacherFilter={false}
      autoTeacherId={teacherId}
    />
  );
}

export default TeacherOverviewPage;
