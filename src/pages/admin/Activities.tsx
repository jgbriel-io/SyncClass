import { ActivitiesView } from "@/components/activities/ActivitiesView";

function AdminActivitiesPage() {
  return (
    <ActivitiesView
      title="Atividades"
      subtitle="Todas as atividades da plataforma"
      isAdmin={true}
    />
  );
}

export default AdminActivitiesPage;
