import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useSearchParams } from "react-router-dom";
import { ClassesView } from "@/components/classes/ClassesView";
import { Loader2 } from "lucide-react";
import type { ClassStatusFilter } from "@/components/filters/ClassesFilters";

const VALID_STATUSES: ClassStatusFilter[] = ["all", "agendada", "avaliacao_pendente", "concluida"];

function TeacherClassesPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const initialStatus =
    statusFromUrl && VALID_STATUSES.includes(statusFromUrl as ClassStatusFilter)
      ? (statusFromUrl as ClassStatusFilter)
      : undefined;

  const { data: teacherId, isLoading: teacherIdLoading } = useQuery({
    queryKey: ["teacherId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("teacher_id")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data?.teacher_id as string | null;
    },
    enabled: !!user?.id && role === "teacher",
  });

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

  return (
    <ClassesView
      title="Aulas"
      subtitle="Registro de aulas e acompanhamento"
      viewMode="table"
      showTeacherColumn={false}
      enableTeacherSelection={false}
      autoTeacherId={teacherId}
      initialStatus={initialStatus}
    />
  );
}

export default TeacherClassesPage;
