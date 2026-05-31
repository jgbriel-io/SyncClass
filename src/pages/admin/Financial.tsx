import { FinancialView } from "@/components/financial/FinancialView";

export default function FinancialPage() {
  return (
    <FinancialView
      title="Financeiro"
      subtitle="Gerencie cobranças e pagamentos"
      showTeacherColumn={true}
      enableTeacherSelection={true}
      autoTeacherId={null}
      isAdmin={true}
    />
  );
}
