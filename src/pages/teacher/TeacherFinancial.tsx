import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { FinancialView } from "@/components/financial/FinancialView";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useTeacherId } from "@/hooks/useTeacherId";
import { typography } from "@/lib/design-tokens/typography";
import { common } from "@/content";

const TeacherFinancialPage = () => {
  const { role, isLoading, teacherId, isError: profileError } = useTeacherId();

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
        <p className={typography("SMALL")}>
          Não foi possível carregar seu perfil de professor.
        </p>
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
