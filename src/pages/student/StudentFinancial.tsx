import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentFinancialCard } from "@/components/student/StudentFinancialCard";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import { CheckCircle, Loader2, DollarSign, Wallet } from "lucide-react";
import {
  useStudentFinancialRecords,
  useStudentStats,
} from "@/hooks/useStudentPortal";
import { typography } from "@/lib/design-tokens/typography";
import { stack } from "@/lib/design-tokens/spacing";
import { studentPortal } from "@/content";

export default function StudentFinancial() {
  const { data: records = [], isLoading, error } = useStudentFinancialRecords();
  const stats = useStudentStats();

  const navigate = useNavigate();
  const paidCount = records.filter((p) => p.status === "pago").length;
  const pendingCount = records.filter((p) => p.status !== "pago").length;
  const isFinancialOk = !stats.hasPendingPayments;

  return (
    <PageContainer constrained maxWidth="5xl">
      <div className={stack("RELAXED")}>
        {/* Título + subtítulo */}
        <div>
          <h1 className={typography("H1")}>{studentPortal.financial.title}</h1>
          <p className={`${typography("SMALL")} mt-1`}>
            {studentPortal.financial.subtitle}
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
            <p className={typography("ERROR")}>
              {studentPortal.financial.loadError}
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Card resumo */}
            <StudentMetricCard
              icon={isFinancialOk ? CheckCircle : Wallet}
              label={studentPortal.financial.financialStatusLabel}
              value={
                isFinancialOk
                  ? studentPortal.financial.financialOk
                  : studentPortal.financial.financialPending(pendingCount)
              }
              description={
                isFinancialOk
                  ? studentPortal.financial.financialOkDescription
                  : paidCount > 0
                    ? `${paidCount} quitada${paidCount !== 1 ? "s" : ""}. ${pendingCount} em aberto.`
                    : `${pendingCount} cobrança${pendingCount !== 1 ? "s" : ""} aguardando pagamento.`
              }
              variant={isFinancialOk ? "success" : "warning"}
            />

            {/* Lista de cobranças */}
            <div className={stack("DEFAULT")}>
              <h2 className={typography("TABLE_HEADER")}>
                {studentPortal.financial.historyTitle}
              </h2>
              {records.length === 0 ? (
                <div className="rounded-lg border bg-card">
                  <EmptyState
                    icon={DollarSign}
                    message={studentPortal.financial.noCharges}
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
                        ? () =>
                            navigate(
                              `/student/financial/checkout/${payment.id}`
                            )
                        : undefined
                    }
                  />
                ))
              )}
            </div>

            {/* Último texto */}
            <p className={`text-center ${typography("SMALL")} px-4`}>
              {studentPortal.financial.contactNote}
            </p>
          </>
        )}
      </div>
    </PageContainer>
  );
}
