import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Pencil, Trash2, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";

// Layout constants - matching StudentsListView pattern
export const COL = {
  STATUS: 96,
  ALUNO: 280,
  INFORMACOES: 240,
  DATA: 140,
  DURACAO: 120,
  NOTA: 130,
  FINANCEIRO: 140,
  AVALIAR: 120,
  ACOES: 100,
} as const;

export const TABLE_MIN_W = COL.STATUS + COL.ALUNO + COL.INFORMACOES + COL.DATA + COL.DURACAO + COL.NOTA + COL.FINANCEIRO + COL.AVALIAR + COL.ACOES;

const CELL_BASE = "px-2 py-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2 align-middle text-left text-xs whitespace-nowrap";
const STICKY_CELL = "sticky left-0 z-20 bg-card group-hover:bg-muted transition-colors";
const STICKY_SHADOW = { boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" };

// Helper functions
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

interface ClassesTableRowProps {
  log: ClassLogWithStudent;
  showTeacherColumn: boolean;
  teacherName: string;
  statusBadge: { label: string; variant: "success" | "warning" | "destructive" | "default" };
  onViewDetail: (log: ClassLogWithStudent) => void;
  onEdit: (log: ClassLogWithStudent) => void;
  onDelete: (log: ClassLogWithStudent) => void;
  onEvaluate: (log: ClassLogWithStudent) => void;
  isEvaluationBlocked: boolean;
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
}: ClassesTableRowProps) {
  const lastUpdatedAt = log.updated_at;
  const { date, timeRange } = formatClassDateAndTime(log);
  const displayTitle = getClassLogDisplayTitle(log);

  const financialStatus = log.financial_records
    ? getFinancialActualStatus({
        status: log.financial_records.status,
        due_date: log.financial_records.due_date,
      })
    : null;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Status */}
      <td className="px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.STATUS, minWidth: COL.STATUS }}>
        <StatusBadge variant={statusBadge.variant}>
          {statusBadge.label}
        </StatusBadge>
      </td>

      {/* Aluno (sticky) */}
      <td
        className={`${CELL_BASE} ${STICKY_CELL} w-[280px] min-w-[280px] max-w-[280px] desktop:w-[360px] desktop:min-w-[360px] desktop:max-w-[360px]`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">
              {log.students?.name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-medium truncate"
              title={log.students?.name || "Aluno não encontrado"}
            >
              {log.students?.name || "Aluno não encontrado"}
            </p>
            {lastUpdatedAt && (
              <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5">
                {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Informações / Título */}
      <td className={CELL_BASE} style={{ width: COL.INFORMACOES, minWidth: COL.INFORMACOES }}>
        {showTeacherColumn ? (
          <div className="flex flex-col gap-0.5 max-w-[200px]">
            <span className="font-medium text-foreground whitespace-normal line-clamp-2" title={displayTitle}>
              {displayTitle}
            </span>
            <span className="text-muted-foreground whitespace-nowrap">
              {teacherName}
            </span>
          </div>
        ) : (
          <span className="font-medium text-foreground whitespace-normal line-clamp-2 max-w-[200px]" title={displayTitle}>
            {displayTitle}
          </span>
        )}
      </td>

      {/* Data */}
      <td className={CELL_BASE} style={{ width: COL.DATA, minWidth: COL.DATA }}>
        <div className="flex flex-col gap-0.5 text-muted-foreground">
          <span>{date}</span>
          {timeRange && <span>{timeRange}</span>}
        </div>
      </td>

      {/* Duração */}
      <td className={CELL_BASE} style={{ width: COL.DURACAO, minWidth: COL.DURACAO }}>
        <span className="text-muted-foreground">
          {formatDuration(log.duration_minutes)}
        </span>
      </td>

      {/* Nota */}
      <td className={CELL_BASE} style={{ width: COL.NOTA, minWidth: COL.NOTA }}>
        <span
          className={`font-medium ${
            log.attendance === false ? "text-destructive" : ""
          }`}
        >
          {log.grade != null
            ? Number(log.grade).toFixed(1)
            : log.attendance === false
              ? "Não compareceu"
              : "—"}
        </span>
      </td>

      {/* Financeiro */}
      <td className={CELL_BASE} style={{ width: COL.FINANCEIRO, minWidth: COL.FINANCEIRO }}>
        {log.financial_records ? (
          <StatusBadge variant={getPaymentStatusVariant(financialStatus)}>
            {getPaymentStatusLabel(financialStatus)}
          </StatusBadge>
        ) : (
          <span className="text-muted-foreground">Sem cobrança</span>
        )}
      </td>

      {/* Botão de avaliar (coluna separada) */}
      <td className={CELL_BASE} style={{ width: COL.AVALIAR, minWidth: COL.AVALIAR }}>
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            className={`h-8 w-[7rem] shrink-0 border-none ${
              isEvaluationBlocked && log.attendance == null
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : log.attendance != null
                  ? "bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                  : "bg-[#25D366] text-white hover:bg-[#1ebe57]"
            }`}
            disabled={isEvaluationBlocked && log.attendance == null}
            onClick={() => onEvaluate(log)}
          >
            {isEvaluationBlocked && log.attendance == null
              ? "Avaliar"
              : log.attendance != null
                ? "Atualizar"
                : "Avaliar"}
          </Button>
        </div>
      </td>

      {/* Ações (apenas olho + menu) */}
      <td className={CELL_BASE} style={{ width: COL.ACOES, minWidth: COL.ACOES }}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetail(log)}
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(log)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(log)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
