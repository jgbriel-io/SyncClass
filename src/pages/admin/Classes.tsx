import { ClassesView } from "@/components/classes/ClassesView";

export default function ClassesPage() {
  return (
    <ClassesView
      title="Aulas"
      subtitle="Registro de aulas e acompanhamento"
      viewMode="table"
      showTeacherColumn={true}
      enableTeacherSelection={true}
    />
  );
}
