import { OverviewView } from "@/components/overview/OverviewView";

function OverviewPage() {
  return (
    <OverviewView
      title="Visão Geral"
      subtitle="Acompanhe métricas consolidadas dos alunos"
      showTeacherFilter={true}
    />
  );
}

export default OverviewPage;
