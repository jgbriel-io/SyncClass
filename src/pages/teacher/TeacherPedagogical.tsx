import TeacherLayout from "@/components/layout/TeacherLayout";

const TeacherPedagogicalPage = () => {
  return (
    <TeacherLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Pedagógico</h2>
        </div>
        <p>Aqui você poderá gerenciar o conteúdo pedagógico, como aulas, materiais e avaliações.</p>
        {/* A funcionalidade de gestão de aulas e materiais será implementada aqui */}
      </div>
    </TeacherLayout>
  );
};

export default TeacherPedagogicalPage;
