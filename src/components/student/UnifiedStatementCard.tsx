import { memo } from "react";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { CheckCircle2, XCircle, CalendarClock, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import type { StudentStatementEntry } from "@/hooks/useStudentStatement";
import { getClassStatusFromDate, getClassStatusWithTime } from "@/lib/utils/classTime";
import { cn } from "@/lib/utils";
import { sanitizeText, escapeHtml } from "@/lib/utils/sanitize";

const BILLING_LABELS: Record<
  NonNullable<StudentStatementEntry["billing_status_consolidated"]>,
  string
> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Atrasado",
  not_billed: "Não Faturado",
  unknown: "—",
};

const BILLING_VARIANTS: Record<
  NonNullable<StudentStatementEntry["billing_status_consolidated"]>,
  "success" | "warning" | "destructive" | "default"
> = {
  paid: "success",
  pending: "warning",
  overdue: "destructive",
  not_billed: "default",
  unknown: "default",
};

interface UnifiedStatementCardProps {
  entry: StudentStatementEntry;
  isLast?: boolean;
}

export const UnifiedStatementCard = memo(function UnifiedStatementCard({
  entry,
  isLast = false,
}: UnifiedStatementCardProps) {
  const { attendance, grade, feedback, title, class_date, start_at, end_at } = entry;
  const billingStatus = entry.billing_status_consolidated ?? "not_billed";
  const hasBilling = entry.financial_record_id != null && entry.billed_amount != null;
  const showGrade = attendance === true && grade != null;
  const classStatus =
    start_at != null || end_at != null
      ? getClassStatusWithTime({
          class_date,
          start_at: start_at ?? null,
          end_at: end_at ?? null,
          attendance,
        })
      : getClassStatusFromDate(class_date, attendance);
  const isConcluida = classStatus.label === "Concluída";

  return (
    <div className="relative pl-12 pb-3">
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
      )}
      <div
        className={cn(
          "absolute left-0 top-2 h-8 w-8 rounded-full bg-background border-2 flex items-center justify-center flex-shrink-0",
          isConcluida && attendance
            ? "border-green-500/30"
            : isConcluida && attendance === false
            ? "border-rose-500/30"
            : classStatus.label === "Agendada" || classStatus.label === "Em andamento"
            ? "border-blue-500/30"
            : "border-muted-foreground/30"
        )}
      >
        {isConcluida ? (
          attendance ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-500" />
          )
        ) : classStatus.label === "Agendada" || classStatus.label === "Em andamento" ? (
          <CalendarClock className="h-4 w-4 text-blue-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-600" />
        )}
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {/* Topo: Data, Matéria/Aula, Badge Presença/Status */}
        <div className="p-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-start gap-2 min-w-0">
            <div className="flex flex-col">
              <span className="text-sm font-medium tabular-nums">
                {formatDate(class_date)}
              </span>
              {(start_at != null || end_at != null) && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {start_at != null
                    ? format(new Date(start_at), "HH:mm", { locale: ptBR })
                    : "—"}
                  {end_at != null &&
                    start_at != null &&
                    ` – ${format(new Date(end_at), "HH:mm", { locale: ptBR })}`}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-none">
              {escapeHtml(title?.trim() || "Aula")}
            </span>
            <StatusBadge
              variant={
                isConcluida
                  ? attendance
                    ? "success"
                    : "destructive"
                  : classStatus.label === "Agendada" || classStatus.label === "Em andamento"
                  ? "info"
                  : "warning"
              }
              className="text-xs shrink-0"
            >
              {isConcluida
                ? attendance
                  ? "Presente"
                  : "Falta"
                : classStatus.label}
            </StatusBadge>
          </div>
          {showGrade ? (
            <span
              className={cn(
                "text-sm font-bold px-2 py-0.5 rounded-full shrink-0",
                Number(grade) >= 7
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : Number(grade) >= 5
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
              )}
            >
              {Number(grade).toFixed(1)}
            </span>
          ) : attendance === false ? (
            <span className="text-sm font-medium text-destructive shrink-0">
              Não compareceu
            </span>
          ) : null}
        </div>

        {/* Centro: Observações */}
        {feedback?.trim() && (
          <div className="px-3 pb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {sanitizeText(feedback)}
            </p>
          </div>
        )}

        {/* Base: Painel Financeiro */}
        <div className="bg-muted/50 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t">
          <span className="text-sm font-semibold tabular-nums">
            {hasBilling ? formatCurrency(Number(entry.billed_amount)) : "—"}
          </span>
          <StatusBadge
            variant={BILLING_VARIANTS[billingStatus]}
            className="text-xs shrink-0"
          >
            {BILLING_LABELS[billingStatus]}
          </StatusBadge>
        </div>
      </div>
    </div>
  );
});
