import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import { getClassStatusWithTime } from "@/lib/utils/classTime";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt, Calendar, Clock, User, BookOpen } from "lucide-react";
import type { ClassLogWithStudent } from "@/hooks/useClassLogs";

function formatClassDateAndTime(log: {
  class_date: string;
  start_at?: string | null;
  end_at?: string | null;
}): { date: string; timeRange: string | null } {
  const date = format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
  if (log.start_at && log.end_at) {
    const start = format(new Date(log.start_at), "HH:mm", { locale: ptBR });
    const end = format(new Date(log.end_at), "HH:mm", { locale: ptBR });
    return { date, timeRange: `${start} às ${end}` };
  }
  return { date, timeRange: null };
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getPaymentStatusVariant(status: string | null): "success" | "warning" | "destructive" {
  switch (status) {
    case "pago":
      return "success";
    case "pendente":
      return "warning";
    case "atrasado":
      return "destructive";
    default:
      return "warning";
  }
}

function getPaymentStatusLabel(status: string | null): string {
  switch (status) {
    case "pago":
      return "Pago";
    case "pendente":
      return "Pendente";
    case "atrasado":
      return "Atrasado";
    default:
      return "Pendente";
  }
}

function getClassLogDisplayTitle(log: { title?: string | null; class_date?: string }): string {
  if (log.title?.trim()) return log.title;
  const d = log.class_date ? format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "";
  return d ? `Aula - ${d}` : "Aula";
}

interface ClassDetailSheetProps {
  classLog: ClassLogWithStudent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Exibir professor (visão admin) */
  showTeacherColumn?: boolean;
  teacherName?: string;
}

export function ClassDetailSheet({
  classLog,
  open,
  onOpenChange,
  showTeacherColumn = false,
  teacherName = "—",
}: ClassDetailSheetProps) {
  if (!classLog) return null;

  const statusBadge = getClassStatusWithTime(classLog);
  const { date, timeRange } = formatClassDateAndTime(classLog);
  const financialStatus = classLog.financial_records
    ? getFinancialActualStatus({
        status: classLog.financial_records.status,
        due_date: classLog.financial_records.due_date,
      })
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-left space-y-1">
            <p className="font-semibold">{getClassLogDisplayTitle(classLog)}</p>
            <p className="text-sm font-normal text-muted-foreground">
              {classLog.students?.name || "Aluno não encontrado"}
            </p>
            <StatusBadge variant={statusBadge.variant}>
              {statusBadge.label}
            </StatusBadge>
          </SheetTitle>
        </SheetHeader>

        <div className="w-full max-h-full self-start overflow-auto px-6 py-4">
          <div className="space-y-5">
            {showTeacherColumn && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Professor
                </p>
                <p className="text-sm text-foreground">{teacherName}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Data e horário
              </p>
              <p className="text-sm text-foreground">{date}</p>
              {timeRange && (
                <p className="text-sm text-muted-foreground">{timeRange}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Duração
              </p>
              <p className="text-sm text-foreground">
                {formatDuration(classLog.duration_minutes)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Nota / Presença
              </p>
              <p className="text-sm text-foreground">
                {classLog.grade != null
                  ? Number(classLog.grade).toFixed(1)
                  : classLog.attendance === false
                    ? "Não compareceu"
                    : "—"}
              </p>
            </div>

            {classLog.financial_records && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" />
                  Financeiro
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    variant={getPaymentStatusVariant(financialStatus)}
                  >
                    {getPaymentStatusLabel(financialStatus)}
                  </StatusBadge>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(classLog.financial_records.amount)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Venc.: {formatDate(classLog.financial_records.due_date)}
                  </span>
                </div>
              </div>
            )}

            {(classLog.feedback || classLog.updated_at) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Feedback
                </p>
                {classLog.feedback ? (
                  <p className="text-sm whitespace-pre-wrap text-foreground rounded-lg border bg-muted/30 p-3">
                    {classLog.feedback}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
                {classLog.updated_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Editado em {format(new Date(classLog.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
