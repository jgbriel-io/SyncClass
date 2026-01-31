import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { FinancialView } from "@/components/financial/FinancialView";
import { Loader2 } from "lucide-react";

const TeacherFinancialPage = () => {
  const { user, role, isLoading: authLoading } = useAuth();

  // Fetch the teacher_id associated with the logged-in user
  const { data: teacherId, isLoading: teacherIdLoading } = useQuery({
    queryKey: ["teacherId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("teacher_id")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching teacher_id:", error);
        return null;
      }

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
    <FinancialView
        title="Meu Financeiro"
        subtitle="Visualize as cobranças dos seus alunos"
        showTeacherColumn={false}
        enableTeacherSelection={false}
        autoTeacherId={teacherId}
      />
  );
};

export default TeacherFinancialPage;
