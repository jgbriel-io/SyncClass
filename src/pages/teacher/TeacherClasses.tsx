import { useSearchParams } from "react-router-dom";
import TeacherLayout from "@/components/layout/TeacherLayout";
import { ClassesView } from "@/components/classes/ClassesView";
import type { ClassStatusFilter } from "@/components/filters/ClassesFilters";

const VALID_STATUSES: ClassStatusFilter[] = ["all", "agendada", "avaliacao_pendente", "concluida"];

const TeacherClassesPage = () => {
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const initialStatus =
    statusFromUrl && VALID_STATUSES.includes(statusFromUrl as ClassStatusFilter)
      ? (statusFromUrl as ClassStatusFilter)
      : undefined;

  return (
    <TeacherLayout>
      <ClassesView
        title="Aulas"
        subtitle="Registre suas aulas e, se quiser, já crie a cobrança vinculada."
        viewMode="cards"
        showTeacherColumn={false}
        enableTeacherSelection={false}
        initialStatus={initialStatus}
      />
    </TeacherLayout>
  );
};

export default TeacherClassesPage;
