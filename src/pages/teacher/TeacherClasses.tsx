import TeacherLayout from "@/components/layout/TeacherLayout";
import { ClassesView } from "@/components/classes/ClassesView";

const TeacherClassesPage = () => {
  return (
    <TeacherLayout>
      <ClassesView
        title="Aulas"
        subtitle="Registre suas aulas e, se quiser, já crie a cobrança vinculada."
        viewMode="cards"
        showTeacherColumn={false}
        enableTeacherSelection={false}
      />
    </TeacherLayout>
  );
};

export default TeacherClassesPage;
