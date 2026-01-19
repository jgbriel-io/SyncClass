import { StudentLayout } from "@/components/layout/StudentLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useStudentFinancialRecords, useStudentStats } from "@/hooks/useStudentPortal";

type PaymentStatus = "paid" | "pending" | "overdue";

function formatDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

function formatDateTime(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle }
> = {
  paid: { label: "Pago", variant: "success", icon: CheckCircle },
  pending: { label: "Pendente", variant: "warning", icon: Clock },
  overdue: { label: "Atrasado", variant: "destructive", icon: AlertCircle },
};

// Map database status to UI status
function mapStatus(status: "pendente" | "pago" | "atrasado"): PaymentStatus {
  if (status === "pago") return "paid";
  if (status === "atrasado") return "overdue";
  return "pending";
}

export default function StudentFinancial() {
  const { data: records = [], isLoading, error } = useStudentFinancialRecords();
  const stats = useStudentStats();

  const paidCount = records.filter((p) => p.status === "pago").length;
  const pendingCount = records.filter((p) => p.status !== "pago").length;
  const isFinancialOk = !stats.hasPendingPayments;

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Seus pagamentos e cobranças
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
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
            {/* Summary Card */}
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  isFinancialOk ? "bg-success-muted" : "bg-warning-muted"
                }`}>
                  {isFinancialOk ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-warning" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">
                    {isFinancialOk ? "Você está em dia" : "Atenção"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {paidCount} pagamento{paidCount !== 1 && "s"} realizado{paidCount !== 1 && "s"}
                    {pendingCount > 0 && ` • ${pendingCount} pendente${pendingCount !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Payments List */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Histórico
              </h2>
              {records.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground rounded-lg border bg-card">
                  Nenhuma cobrança registrada ainda
                </div>
              ) : (
                records.map((payment, index) => {
                  const uiStatus = mapStatus(payment.status);
                  const config = statusConfig[uiStatus];
                  const Icon = config.icon;
                  return (
                    <div
                      key={payment.id}
                      className="rounded-lg border bg-card p-4 shadow-card animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              uiStatus === "paid"
                                ? "bg-success-muted"
                                : uiStatus === "pending"
                                ? "bg-warning-muted"
                                : "bg-destructive-muted"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                uiStatus === "paid"
                                  ? "text-success"
                                  : uiStatus === "pending"
                                  ? "text-warning"
                                  : "text-destructive"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">
                              {payment.description || "Cobrança"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {uiStatus === "paid" && payment.paid_at
                                ? `Pago em ${formatDateTime(payment.paid_at)}`
                                : `Vence em ${formatDate(payment.due_date)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-sm">
                            {formatCurrency(Number(payment.amount))}
                          </p>
                          <StatusBadge variant={config.variant} className="mt-1">
                            {config.label}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-muted-foreground px-4">
              Dúvidas sobre pagamentos? Entre em contato com a secretaria.
            </p>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
