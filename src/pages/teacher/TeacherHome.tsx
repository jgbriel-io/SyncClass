import TeacherLayout from "@/components/layout/TeacherLayout";

const TeacherHome = () => {
  return (
    <TeacherLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Painel do Professor
          </h2>
        </div>
        <p>Bem-vindo ao seu painel. Aqui você pode gerenciar seus alunos e aulas.</p>
      </div>
    </TeacherLayout>
  );
};

export default TeacherHome;
