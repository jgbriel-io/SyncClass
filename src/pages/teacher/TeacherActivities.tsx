import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { ActivitiesView } from "@/components/activities/ActivitiesView";

const TeacherActivitiesPage = () => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const { data: profile } = useCurrentUserProfile(user?.id);

  return (
    <ActivitiesView
      title="Atividades"
      subtitle={isAdmin ? "Todas as atividades da plataforma" : "Envie materiais e correções para seus alunos"}
      autoTeacherId={isAdmin ? undefined : profile?.teacher_id}
      isAdmin={isAdmin}
    />
  );
};

export default TeacherActivitiesPage;
