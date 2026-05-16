import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { FinancialView } from "@/components/financial/FinancialView";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { typography } from "@/lib/design-tokens/typography";
import { common } from "@/content";

const TeacherFinancialPage = () => {
  const { user, role, isLoading: authLoading } = useAuth();

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
    if (teacherIdError) toast.error(common.errors.loadProfile);
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
      <div className="text-center py-12">
        <p className={typography('SMALL')}>Não foi possível carregar seu perfil de professor.</p>
      </div>
    );
  }

  return (
    <FinancialView
        title="Financeiro"
        subtitle="Gerencie cobranças e pagamentos"
        showTeacherColumn={false}
        enableTeacherSelection={false}
        autoTeacherId={teacherId}
      />
  );
};

export default TeacherFinancialPage;
