import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useSearchParams } from "react-router-dom";
import { StudentsListView } from "@/components/students/StudentsListView";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTeachers } from "@/hooks/useTeachers";

const TeacherStudentsPage = () => {
  const { user, role, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const { data: teachers = [] } = useTeachers();

  const { data: teacherId, isLoading: teacherIdLoading, isError: teacherIdError } = useQuery({
    queryKey: ["teacherId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("teacher_id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data?.teacher_id as string | null;
    },
    enabled: !!user?.id && role === "teacher",
  });

  useEffect(() => {
    if (teacherIdError) toast.error("Erro ao carregar seu perfil. Tente recarregar a página.");
  }, [teacherIdError]);

  if (authLoading || teacherIdLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "teacher") {
    return <Navigate to="/login" replace />;
  }

  if (!teacherId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Não foi possível carregar seu perfil de professor.</p>
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
