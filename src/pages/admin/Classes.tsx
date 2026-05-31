import { useSearchParams } from "react-router-dom";
import { ClassesView } from "@/components/classes/ClassesView";
import type { ClassStatusFilter } from "@/components/filters/ClassesFilters";

const VALID_STATUSES: ClassStatusFilter[] = [
  "all",
  "agendada",
  "avaliacao_pendente",
  "concluida",
];

export default function ClassesPage() {
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const initialStatus =
    statusFromUrl && VALID_STATUSES.includes(statusFromUrl as ClassStatusFilter)
      ? (statusFromUrl as ClassStatusFilter)
      : undefined;

  return (
    <ClassesView
      title="Aulas"
      subtitle="Registro de aulas e acompanhamento"
      viewMode="table"
      showTeacherColumn={true}
      enableTeacherSelection={true}
      initialStatus={initialStatus}
      isAdmin={true}
    />
  );
}
