import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

type FinancialStatus = "pago" | "pendente" | "atrasado";

interface StudentFinancialCardProps {
  record: {
    id: string;
    amount: number;
    status: FinancialStatus;
    due_date: string;
    description?: string | null;
    payment_date?: string | null;
  };
  onPayClick?: () => void;
}

const statusConfig: Record<FinancialStatus, {
  variant: "success" | "warning" | "destructive";
  label: string;
  borderColor: string;
}> = {
  pago: {
    variant: "success",
    label: "Pago",
    borderColor: "border-l-success",
  },
  pendente: {
    variant: "warning",
    label: "Pendente",
    borderColor: "border-l-warning",
  },
  atrasado: {
    variant: "destructive",
    label: "Atrasado",
    borderColor: "border-l-destructive",
  },
};

export function StudentFinancialCard({ record, onPayClick }: StudentFinancialCardProps) {
  const config = statusConfig[record.status];
  
  const formattedDueDate = formatDate(record.due_date);

  const formattedPaymentDate = record.payment_date
    ? formatDate(record.payment_date)
    : null;

  return (
    <Card className={cn("p-4 border-l-4", config.borderColor)}>
      <div className="space-y-3">
        {/* Valor e Status */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{formatCurrency(record.amount)}</span>
          <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
        </div>

        {/* Informações */}
        <div className="space-y-2 text-sm">
          {/* Vencimento */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">
              Vencimento: <span className="font-medium text-foreground">{formattedDueDate}</span>
            </span>
          </div>

          {/* Data de pagamento (se pago) */}
          {formattedPaymentDate && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              <span className="text-muted-foreground">
                Pago em: <span className="font-medium text-foreground">{formattedPaymentDate}</span>
              </span>
            </div>
          )}

          {/* Descrição */}
          {record.description && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{record.description}</span>
            </div>
          )}

          {/* Alerta de atraso */}
          {record.status === "atrasado" && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Pagamento em atraso</span>
            </div>
          )}
        </div>

        {/* Botão de pagamento (apenas se pendente ou atrasado) */}
        {(record.status === "pendente" || record.status === "atrasado") && onPayClick && (
          <Button
            className="w-full"
            size="sm"
            variant={record.status === "atrasado" ? "destructive" : "default"}
            onClick={onPayClick}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar Agora
          </Button>
        )}
      </div>
    </Card>
  );
}
