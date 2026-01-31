import { useTeachers } from "@/hooks/useTeachers";
import { StudentsListView } from "@/components/students/StudentsListView";

export default function StudentsPage() {
  const { data: teachers = [] } = useTeachers();

  return (
    <StudentsListView
        title="Alunos"
        subtitle="Gerencie todos os alunos cadastrados"
        showTeacherColumn={true}
        showTeacherFilter={true}
        autoTeacherId={null}
        teachers={teachers}
      />
  );
}
