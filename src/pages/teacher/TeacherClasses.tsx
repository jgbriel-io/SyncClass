import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { ClassesView } from "@/components/classes/ClassesView";
import { Loader2 } from "lucide-react";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import type { ClassStatusFilter } from "@/components/filters/ClassesFilters";
import { typography } from "@/lib/design-tokens/typography";

const VALID_STATUSES: ClassStatusFilter[] = ["all", "agendada", "avaliacao_pendente", "concluida"];

function TeacherClassesPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const initialStatus =
    statusFromUrl && VALID_STATUSES.includes(statusFromUrl as ClassStatusFilter)
      ? (statusFromUrl as ClassStatusFilter)
      : undefined;

  const { data: profile, isLoading: profileLoading } = useCurrentUserProfile(user?.id);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "teacher") {
    return <Navigate to="/login" replace />;
  }

  if (!profile?.teacher_id) {
    return (
      <div className="text-center py-12">
        <p className={typography('SMALL')}>Não foi possível carregar seu perfil de professor.</p>
      </div>
    );
  }

  return (
    <ClassesView
      title="Aulas"
      subtitle="Registro de aulas e acompanhamento"
      viewMode="table"
      showTeacherColumn={false}
      enableTeacherSelection={false}
      autoTeacherId={profile.teacher_id}
      initialStatus={initialStatus}
    />
  );
}

export default TeacherClassesPage;
