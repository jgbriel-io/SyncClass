import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { StudentsListView } from "@/components/students/StudentsListView";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTeachers } from "@/hooks/useTeachers";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { typography } from "@/lib/design-tokens/typography";
import { common } from "@/content";

const TeacherStudentsPage = () => {
  const { user, role, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const { data: teachers = [] } = useTeachers();

  const { data: profile, isLoading: profileLoading, isError: profileError } = useCurrentUserProfile(user?.id);

  useEffect(() => {
    if (profileError) toast.error(common.errors.loadProfile);
  }, [profileError]);

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

  const filterFromUrl = searchParams.get("filter");
  const initialFilterPreset = filterFromUrl === "aniversariantes" ? "aniversariantes" : "all";

  return (
    <StudentsListView
        title="Alunos"
        subtitle="Gerencie seus alunos"
        showTeacherColumn={false}
        showTeacherFilter={false}
        autoTeacherId={profile.teacher_id}
        teachers={teachers}
        initialSearch={searchFromUrl}
        initialFilterPreset={initialFilterPreset}
      />
  );
};

export default TeacherStudentsPage;
