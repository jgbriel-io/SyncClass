import { useState } from "react";
import TeacherLayout from "@/components/layout/TeacherLayout";
import { useStudentsByTeacher, useCreateStudentForTeacher } from "@/hooks/useStudentsByTeacher";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/pages/teacher/StudentsColumns";
import { Button } from "@/components/ui/button";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import { StudentInsert } from "@/hooks/useStudents";

const TeacherStudentsPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const {
    data: students,
    isLoading,
    isError,
  } = useStudentsByTeacher();
  const createStudent = useCreateStudentForTeacher();

  const handleCreateStudent = (data: StudentInsert) => {
    createStudent.mutate(data as any, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  if (isLoading) return <div>Carregando alunos...</div>;
  if (isError) return <div>Ocorreu um erro ao buscar os alunos.</div>;

  return (
    <TeacherLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Meus Alunos</h2>
          <Button onClick={() => setIsFormOpen(true)}>Cadastrar aluno</Button>
        </div>
        {students && <DataTable columns={columns} data={students} />}
      </div>

      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateStudent}
        isLoading={createStudent.isPending}
      />
    </TeacherLayout>
  );
};

export default TeacherStudentsPage;
