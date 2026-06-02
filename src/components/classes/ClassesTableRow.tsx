import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL } from "./ClassesTableRow.constants";
import { classes as classesContent } from "@/content";

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
      return classesContent.tableRow.statusPaid;
    case "pendente":
      return classesContent.tableRow.statusPending;
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
  financial_records?: Array<{ description?: string | null }> | null;
}): string {
  const rawTitle = log.title?.trim();
  if (rawTitle) return rawTitle;

  if (log.financial_record_via_package) {
    const packageDescription = log.financial_records?.[0]?.description?.trim();
    if (packageDescription) return packageDescription;
  }

  const d = log.class_date
    ? format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", {
        locale: ptBR,
      })
    : "";
  return d ? `${classesContent.view.title} - ${d}` : classesContent.view.title;
}

interface ClassesTableRowProps {
  log: ClassLogWithStudent;
  showTeacherColumn: boolean;
  teacherName: string;
  statusBadge: {
    label: string;
    variant: "success" | "warning" | "destructive" | "default";
  };
  onViewDetail: (log: ClassLogWithStudent) => void;
  onEdit: (log: ClassLogWithStudent) => void;
  onDelete: (log: ClassLogWithStudent) => void;
  onEvaluate: (log: ClassLogWithStudent) => void;
  isEvaluationBlocked: boolean;
  isAdmin?: boolean;
}

export function ClassesTableRow({
  log,
  showTeacherColumn,
  teacherName,
  statusBadge,
  onViewDetail,
  onEdit,
  onDelete,
  onEvaluate,
  isEvaluationBlocked,
  isAdmin = false,
}: ClassesTableRowProps) {
  const lastUpdatedAt = log.updated_at;
  const { date, timeRange } = formatClassDateAndTime(log);
  const displayTitle = getClassLogDisplayTitle(log);

  const hasDirectFinancial =
    log.financial_records && log.financial_records.length > 0;
  const packageFinancial =
    log.financial_record_class_logs?.[0]?.financial_records;

  const financialStatus = hasDirectFinancial
    ? getFinancialActualStatus({
        status: log.financial_records[0].status,
        due_date: log.financial_records[0].due_date,
      })
    : packageFinancial
      ? getFinancialActualStatus({
          status: packageFinancial.status,
          due_date: packageFinancial.due_date,
        })
      : null;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      <td
        className="px-2 py-2 align-middle whitespace-nowrap"
        style={{ width: "1%" }}
      >
        <StatusBadge variant={statusBadge.variant}>
          {statusBadge.label}
        </StatusBadge>
      </td>

      <td
        className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">
              {log.students?.name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium truncate"
              title={log.students?.name || common.errors.studentNotFound}
            >
              {log.students?.name || common.errors.studentNotFound}
            </p>
            {lastUpdatedAt && (
              <p
                className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate"
                title={`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              >
                {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              </p>
            )}
          </div>
        </div>
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.INFORMACOES, minWidth: COL.INFORMACOES }}
      >
        {showTeacherColumn ? (
          <div className="flex flex-col gap-0.5">
            <span
              className="text-xs font-medium text-foreground whitespace-normal line-clamp-2"
              title={displayTitle}
            >
              {displayTitle}
            </span>
            <span
              className="text-xs text-muted-foreground whitespace-nowrap truncate"
              title={teacherName}
            >
              {teacherName}
            </span>
          </div>
        ) : (
          <span
            className="text-xs font-medium text-foreground whitespace-normal line-clamp-2"
            title={displayTitle}
          >
            {displayTitle}
          </span>
        )}
      </td>

      <td
        className={`${CELL_BASE} tabular-nums`}
        style={{ width: COL.DATA, minWidth: COL.DATA }}
      >
        <div className="flex flex-col gap-0.5 text-muted-foreground">
          <span className="truncate" title={date}>
            {date}
          </span>
          {timeRange && (
            <span className="truncate" title={timeRange}>
              {timeRange}
            </span>
          )}
        </div>
      </td>

      <td
        className={`${CELL_BASE} tabular-nums`}
        style={{ width: COL.DURACAO, minWidth: COL.DURACAO }}
      >
        <span
          className="text-muted-foreground truncate block"
          title={formatDuration(log.duration_minutes)}
        >
          {formatDuration(log.duration_minutes)}
        </span>
      </td>

      <td
        className={`${CELL_BASE} tabular-nums`}
        style={{ width: COL.NOTA, minWidth: COL.NOTA }}
      >
        <span
          className={`font-medium truncate block ${
            log.attendance === false ? "text-destructive" : ""
          }`}
          title={
            log.grade != null
              ? Number(log.grade).toFixed(1)
              : log.attendance === false
                ? classesContent.tableRow.noAttendance
                : "—"
          }
        >
          {log.grade != null
            ? Number(log.grade).toFixed(1)
            : log.attendance === false
              ? classesContent.tableRow.noAttendance
              : "—"}
        </span>
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.FINANCEIRO, minWidth: COL.FINANCEIRO }}
      >
        {hasDirectFinancial || packageFinancial ? (
          <StatusBadge variant={getPaymentStatusVariant(financialStatus)}>
            {getPaymentStatusLabel(financialStatus)}
          </StatusBadge>
        ) : (
          <StatusBadge variant="default">
            {classesContent.tableRow.noCharge}
          </StatusBadge>
        )}
      </td>

      {!isAdmin && (
        <td
          className={CELL_BASE}
          style={{ width: COL.AVALIAR, minWidth: COL.AVALIAR }}
        >
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              className={`h-8 w-[7rem] shrink-0 border-none text-xs ${
                isEvaluationBlocked && log.attendance == null
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : log.attendance != null
                    ? "bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                    : "bg-success-action text-white hover:bg-success-action/90"
              }`}
              disabled={isEvaluationBlocked && log.attendance == null}
              onClick={() => onEvaluate(log)}
            >
              {isEvaluationBlocked && log.attendance == null
                ? classesContent.tableRow.evaluate
                : log.attendance != null
                  ? classesContent.tableRow.update
                  : classesContent.tableRow.evaluate}
            </Button>
          </div>
        </td>
      )}

      <td
        className={CELL_BASE}
        style={{ width: COL.ACOES, minWidth: COL.ACOES }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetail(log)}
            title={classesContent.tableRow.viewDetails}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {!isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(log)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {classesContent.tableRow.edit}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(log)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {classesContent.tableRow.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </td>
    </tr>
  );
}
