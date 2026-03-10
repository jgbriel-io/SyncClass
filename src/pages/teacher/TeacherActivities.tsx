import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivitiesView } from "@/components/activities/ActivitiesView";

const TeacherActivitiesPage = () => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";

  const { data: teacherId } = useQuery({
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
    enabled: !!user?.id && !isAdmin,
  });

  return (
    <ActivitiesView
      title="Atividades"
      subtitle={isAdmin ? "Todas as atividades da plataforma" : "Envie materiais e correções para seus alunos"}
      autoTeacherId={isAdmin ? undefined : teacherId}
      isAdmin={isAdmin}
    />
  );
};

export default TeacherActivitiesPage;
