import { OverviewView } from "@/components/overview/OverviewView";

function StudentOverviewPage() {
  return (
    <OverviewView
      title="Visão Geral dos Alunos"
      subtitle="Estatísticas completas de todos os alunos"
      showTeacherFilter={true}
    />
  );
}

export default StudentOverviewPage;
