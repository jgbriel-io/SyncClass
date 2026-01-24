import TeacherLayout from "@/components/layout/TeacherLayout";

const TeacherPedagogicalPage = () => {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Pedagógico</h1>
          <p className="text-muted-foreground">Registro de aulas e acompanhamento</p>
        </div>
        <p>Aqui você poderá gerenciar o conteúdo pedagógico, como aulas, materiais e avaliações.</p>
        {/* A funcionalidade de gestão de aulas e materiais será implementada aqui */}
      </div>
    </TeacherLayout>
  );
};

export default TeacherPedagogicalPage;
