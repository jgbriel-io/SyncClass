import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentFinancialCard } from "@/components/student/StudentFinancialCard";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import { CheckCircle, AlertCircle, Loader2, DollarSign, Wallet } from "lucide-react";
import { useStudentFinancialRecords, useStudentStats } from "@/hooks/useStudentPortal";

export default function StudentFinancial() {
  const { data: records = [], isLoading, error } = useStudentFinancialRecords();
  const stats = useStudentStats();

  const paidCount = records.filter((p) => p.status === "pago").length;
  const pendingCount = records.filter((p) => p.status !== "pago").length;
  const isFinancialOk = !stats.hasPendingPayments;

  return (
    <PageContainer constrained maxWidth="5xl">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Seus pagamentos e cobranças
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <EmptyState size="lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </EmptyState>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive text-sm">
              Erro ao carregar dados financeiros. Tente novamente.
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* ⚡ P0-1: Summary usando StudentMetricCard */}
            <StudentMetricCard
              icon={isFinancialOk ? CheckCircle : Wallet}
              label={isFinancialOk ? "Você está em dia" : "Atenção"}
              value={pendingCount > 0 ? `${pendingCount} pendente${pendingCount !== 1 ? "s" : ""}` : "Tudo certo"}
              description={`${paidCount} pagamento${paidCount !== 1 ? "s" : ""} realizado${paidCount !== 1 ? "s" : ""}`}
              variant={isFinancialOk ? "success" : "warning"}
            />

            {/* ⚡ P0-1: Payments List usando StudentFinancialCard */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Histórico de Pagamentos
              </h2>
              {records.length === 0 ? (
                <div className="rounded-lg border bg-card">
                  <EmptyState
                    icon={DollarSign}
                    message="Nenhuma cobrança registrada ainda"
                  />
                </div>
              ) : (
                records.map((payment) => (
                  <StudentFinancialCard
                    key={payment.id}
                    record={{
                      id: payment.id,
                      amount: Number(payment.amount),
                      status: payment.status,
                      due_date: payment.due_date,
                      description: payment.description,
                      payment_date: payment.paid_at,
                    }}
                  />
                ))
              )}
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-muted-foreground px-4">
              Dúvidas sobre pagamentos? Entre em contato com a secretaria.
            </p>
          </>
        )}
    </PageContainer>
  );
}
