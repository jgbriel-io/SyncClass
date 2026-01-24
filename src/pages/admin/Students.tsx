import { AdminLayout } from "@/components/layout/AdminLayout";
import { useTeachers } from "@/hooks/useTeachers";
import { StudentsListView } from "@/components/students/StudentsListView";

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

function formatCurrency(value: number | null | undefined): string {
  if (!value && value !== 0) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export default function StudentsPage() {
  const { data: teachers = [] } = useTeachers();

  return (
    <AdminLayout>
      <StudentsListView
        title="Alunos"
        subtitle="Gerencie todos os alunos cadastrados"
        showTeacherColumn={true}
        showTeacherFilter={true}
        autoTeacherId={null}
        teachers={teachers}
      />
    </AdminLayout>
  );
}
