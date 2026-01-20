import TeacherLayout from "@/components/layout/TeacherLayout";
import { useStudentsByTeacher } from "@/hooks/useStudentsByTeacher";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/pages/teacher/StudentsColumns";

const TeacherStudentsPage = () => {
  const { user } = useAuth();
  const {
    data: students,
    isLoading,
    isError,
  } = useStudentsByTeacher(user?.id);

  if (isLoading) return <div>Carregando alunos...</div>;
  if (isError) return <div>Ocorreu um erro ao buscar os alunos.</div>;

  return (
    <TeacherLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Meus Alunos</h2>
        </div>
        {students && <DataTable columns={columns} data={students} />}
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudentsPage;
