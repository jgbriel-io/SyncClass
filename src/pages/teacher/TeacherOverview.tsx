import { OverviewView } from "@/components/overview/OverviewView";
import { useTeacherId } from "@/hooks/useTeacherId";

function TeacherOverviewPage() {
  const { teacherId } = useTeacherId();

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
