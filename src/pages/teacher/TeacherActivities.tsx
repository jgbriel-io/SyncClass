import { useTeacherId } from "@/hooks/useTeacherId";
import { ActivitiesView } from "@/components/activities/ActivitiesView";

const TeacherActivitiesPage = () => {
  const { role, teacherId } = useTeacherId();
  const isAdmin = role === "admin";

  return (
    <ActivitiesView
      title="Atividades"
      subtitle={
        isAdmin
          ? "Todas as atividades da plataforma"
          : "Envie materiais e correções para seus alunos"
      }
      autoTeacherId={isAdmin ? undefined : teacherId}
      isAdmin={isAdmin}
    />
  );
};

export default TeacherActivitiesPage;
