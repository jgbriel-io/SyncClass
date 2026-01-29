import { AdminLayout } from "@/components/layout/AdminLayout";
import { ClassesView } from "@/components/classes/ClassesView";

export default function ClassesPage() {
  return (
    <AdminLayout>
      <ClassesView
        title="Aulas"
        subtitle="Registro de aulas e acompanhamento"
        viewMode="table"
        showTeacherColumn={true}
        enableTeacherSelection={true}
      />
    </AdminLayout>
  );
}
