import { OverviewView } from "@/components/overview/OverviewView";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";

function TeacherOverviewPage() {
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile(user?.id);

  return (
    <OverviewView
      title="Visão Geral dos Alunos"
      subtitle="Estatísticas dos seus alunos"
      showTeacherFilter={false}
      autoTeacherId={profile?.teacher_id}
    />
  );
}

export default TeacherOverviewPage;
