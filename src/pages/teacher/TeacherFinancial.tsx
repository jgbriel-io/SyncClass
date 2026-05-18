import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { FinancialView } from "@/components/financial/FinancialView";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { typography } from "@/lib/design-tokens/typography";
import { common } from "@/content";

const TeacherFinancialPage = () => {
  const { user, role, isLoading: authLoading } = useAuth();
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

  return (
    <FinancialView
        title="Financeiro"
        subtitle="Gerencie cobranças e pagamentos"
        showTeacherColumn={false}
        enableTeacherSelection={false}
        autoTeacherId={profile.teacher_id}
      />
  );
};

export default TeacherFinancialPage;
