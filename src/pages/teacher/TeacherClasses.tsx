import TeacherLayout from "@/components/layout/TeacherLayout";

const TeacherClassesPage = () => {
  return (
    <TeacherLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Minhas Aulas</h2>
        </div>
        <p>Aqui você poderá ver e gerenciar suas aulas agendadas.</p>
        {/* A funcionalidade de listagem de aulas será implementada aqui */}
      </div>
    </TeacherLayout>
  );
};

export default TeacherClassesPage;
