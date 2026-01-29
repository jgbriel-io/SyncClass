import { AdminLayout } from "@/components/layout/AdminLayout";
import { FinancialView } from "@/components/financial/FinancialView";

export default function FinancialPage() {
  return (
    <AdminLayout>
      <FinancialView
        title="Financeiro"
        subtitle="Gerencie cobranças e pagamentos"
        showTeacherColumn={true}
        enableTeacherSelection={true}
        autoTeacherId={null}
      />
    </AdminLayout>
  );
}
