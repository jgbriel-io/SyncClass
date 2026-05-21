import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { StudentsListView } from "@/components/students/StudentsListView";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTeachers } from "@/hooks/useTeachers";
import { useTeacherId } from "@/hooks/useTeacherId";
import { typography } from "@/lib/design-tokens/typography";
import { common } from "@/content";

const TeacherStudentsPage = () => {
  const { role, isLoading, teacherId, isError: profileError } = useTeacherId();
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const { data: teachers = [] } = useTeachers();

  useEffect(() => {
    if (profileError) toast.error(common.errors.loadProfile);
  }, [profileError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "teacher") {
    return <Navigate to="/login" replace />;
  }

  if (!teacherId) {
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
        autoTeacherId={teacherId}
        teachers={teachers}
        initialSearch={searchFromUrl}
        initialFilterPreset={initialFilterPreset}
      />
  );
};

export default TeacherStudentsPage;
