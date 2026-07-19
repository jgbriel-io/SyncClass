import { BaseDetailSheet } from "@/components/ui/custom/BaseDetailSheet";
import {
  DetailSection,
  DetailSectionGroup,
} from "@/components/ui/custom/DetailSection";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import { getClassStatusWithTime } from "@/lib/utils/classTime";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Receipt,
  Calendar,
  Clock,
  User,
  BookOpen,
} from "@phosphor-icons/react";
import type { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { sanitizeText, escapeHtml } from "@/lib/utils/sanitize";
import { classes as classesContent, common } from "@/content";

function formatClassDateAndTime(log: {
  class_date: string;
  start_at?: string | null;
  end_at?: string | null;
}): { date: string; timeRange: string | null } {
  const date = format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", {
    locale: ptBR,
  });
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

function getPaymentStatusVariant(
  status: string | null
): "success" | "warning" | "destructive" {
  switch (status) {
    case "pago":
      return "success";
    case "atrasado":
      return "destructive";
    case "pendente":
    case "validando":
    default:
      return "warning";
  }
}

function getPaymentStatusLabel(status: string | null): string {
  switch (status) {
    case "pago":
      return classesContent.tableRow.statusPaid;
    case "atrasado":
      return classesContent.tableRow.statusOverdue;
    case "validando":
      return classesContent.tableRow.statusValidating;
    default:
      return classesContent.tableRow.statusPending;
  }
}

function getClassLogDisplayTitle(log: {
  title?: string | null;
  class_date?: string;
  financial_record_via_package?: boolean;
}): string {
  const rawTitle = log.title?.trim();
  const isPackage = log.financial_record_via_package;

  // Se tem título customizado
  if (rawTitle) {
    return isPackage
      ? `${escapeHtml(rawTitle)} (Pacote)`
      : escapeHtml(rawTitle);
  }

  // Fallback: "Aula - data"
  const d = log.class_date
    ? format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", {
        locale: ptBR,
      })
    : "";
  const fallbackTitle = d ? `Aula - ${d}` : "Aula";
  return isPackage ? `${fallbackTitle} (Pacote)` : fallbackTitle;
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
  const financialStatus =
    classLog.financial_records && classLog.financial_records.length > 0
      ? getFinancialActualStatus({
          status: classLog.financial_records[0].status,
          due_date: classLog.financial_records[0].due_date,
        })
      : null;

  return (
    <BaseDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={getClassLogDisplayTitle(classLog)}
      subtitle={
        <>
          <p className="text-sm font-normal text-muted-foreground">
            {classLog.students?.name || common.errors.studentNotFound}
          </p>
          <StatusBadge variant={statusBadge.variant}>
            {statusBadge.label}
          </StatusBadge>
        </>
      }
      size="DEFAULT"
    >
      <DetailSectionGroup>
        {showTeacherColumn && (
          <DetailSection icon={User} label="Professor" value={teacherName} />
        )}

        <DetailSection
          icon={Calendar}
          label="Data e horário"
          value={
            <>
              <p>{date}</p>
              {timeRange && (
                <p className="text-muted-foreground">{timeRange}</p>
              )}
            </>
          }
        />

        <DetailSection
          icon={Clock}
          label="Duração"
          value={formatDuration(classLog.duration_minutes)}
        />

        <DetailSection
          icon={BookOpen}
          label="Nota / Presença"
          value={
            classLog.grade != null
              ? Number(classLog.grade).toFixed(1)
              : classLog.attendance === false
                ? classesContent.tableRow.noAttendance
                : "—"
          }
        />

        {classLog.financial_records &&
          classLog.financial_records.length > 0 && (
            <DetailSection
              icon={Receipt}
              label={classesContent.detailSheet.financialSection}
              value={
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    variant={getPaymentStatusVariant(financialStatus)}
                  >
                    {getPaymentStatusLabel(financialStatus)}
                  </StatusBadge>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(classLog.financial_records[0].amount)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {classesContent.detailSheet.financialSection}:{" "}
                    {formatDate(classLog.financial_records[0].due_date)}
                  </span>
                </div>
              }
            />
          )}

        {/* Observações e Feedback */}
        <div className="space-y-4">
          {/* Observações (preenchidas ao criar a aula) */}
          {classLog.observations?.trim() && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {classesContent.detailSheet.observationsSection}
              </p>
              <p className="text-sm whitespace-pre-wrap text-foreground rounded-lg border bg-muted/30 p-3">
                {sanitizeText(classLog.observations)}
              </p>
            </div>
          )}

          {/* Feedback (preenchido ao avaliar a aula) */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {classesContent.detailSheet.feedbackSection}
            </p>
            {classLog.feedback?.trim() ? (
              <p className="text-sm whitespace-pre-wrap text-foreground rounded-lg border bg-muted/30 p-3">
                {sanitizeText(classLog.feedback)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>

          {classLog.updated_at && (
            <p className="text-xs text-muted-foreground">
              {classesContent.tableRow.editedAt}{" "}
              {format(new Date(classLog.updated_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          )}
        </div>
      </DetailSectionGroup>
    </BaseDetailSheet>
  );
}
