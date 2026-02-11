import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentFinancialCard } from "@/components/student/StudentFinancialCard";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import { CheckCircle, Loader2, DollarSign, Wallet } from "lucide-react";
import { useStudentFinancialRecords, useStudentStats } from "@/hooks/useStudentPortal";

export default function StudentFinancial() {
  const { data: records = [], isLoading, error } = useStudentFinancialRecords();
  const stats = useStudentStats();

  const navigate = useNavigate();
  const paidCount = records.filter((p) => p.status === "pago").length;
  const pendingCount = records.filter((p) => p.status !== "pago").length;
  const isFinancialOk = !stats.hasPendingPayments;

  return (
    <PageContainer constrained maxWidth="5xl">
      <div className="space-y-6">
        {/* Título + subtítulo */}
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
            {/* Card resumo */}
            <StudentMetricCard
              icon={isFinancialOk ? CheckCircle : Wallet}
              label="Situação financeira"
              value={isFinancialOk ? "Em dia" : `${pendingCount} pendência${pendingCount !== 1 ? "s" : ""}`}
              description={isFinancialOk ? "Nenhuma cobrança pendente" : paidCount > 0 ? `${paidCount} quitada${paidCount !== 1 ? "s" : ""}. ${pendingCount} em aberto.` : `${pendingCount} cobrança${pendingCount !== 1 ? "s" : ""} aguardando pagamento.`}
              variant={isFinancialOk ? "success" : "warning"}
            />

            {/* Lista de cobranças */}
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
                    onPayClick={
                      payment.status !== "pago"
                        ? () => navigate(`/student/financial/checkout/${payment.id}`)
                        : undefined
                    }
                  />
                ))
              )}
            </div>

            {/* Último texto */}
            <p className="text-center text-sm text-muted-foreground px-4">
              Dúvidas sobre pagamentos? Entre em contato com a secretaria.
            </p>
          </>
        )}
      </div>
    </PageContainer>
  );
}
