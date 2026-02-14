import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Receipt,
  Check,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { isClassEvaluationBlocked, getClassStatusWithTime } from "@/lib/utils/classTime";
import { sanitizeText, escapeHtml } from "@/lib/utils/sanitize";

/* ── Layout constants (espelhando o padrão da aba Alunos) ─────────── */

export const COL = {
  ALUNO: 280,
  AULA_PROF: 220,
  DATA: 140,
  NOTA: 130,
  FINANCEIRO: 140,
  VALOR: 120,
  FEEDBACK: 200,
  ACOES: 160,
} as const;

export const TABLE_MIN_W = COL.ALUNO + COL.AULA_PROF + COL.DATA + COL.NOTA + COL.FINANCEIRO + COL.VALOR + COL.FEEDBACK + COL.ACOES;

const CELL = "px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-4 laptop:py-3 align-middle text-left text-sm mobile:text-xs tablet:text-xs laptop:text-xs whitespace-nowrap";
const STICKY_CELL = "sticky left-0 z-20 bg-card";
const STICKY_SHADOW = { boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" };

/* ── Formatação local ──────────────────────────────────────────────── */

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

function getClassStatusBadge(log: {
  class_date: string;
  attendance: boolean | null;
  start_at: string | null;
  end_at: string | null;
}) {
  return getClassStatusWithTime(log);
}

/* ── Props ─────────────────────────────────────────────────────────── */

interface ClassLogRowProps {
  log: ClassLogWithStudent;
  currentTeacherName: string;
  isMutating: boolean;
  onEdit: (log: ClassLogWithStudent) => void;
  onDelete: (log: ClassLogWithStudent) => void;
  onPostClass: (log: ClassLogWithStudent) => void;
}

/* ── Componente ────────────────────────────────────────────────────── */

export function ClassLogRow({
  log,
  currentTeacherName,
  isMutating,
  onEdit,
  onDelete,
  onPostClass,
}: ClassLogRowProps) {
  const lastUpdatedAt = log.updated_at;
  const { date, timeRange } = formatClassDateAndTime(log);
  const statusBadge = getClassStatusBadge(log);
  const blocked = isClassEvaluationBlocked(log);

  return (
    <tr className="group border-b transition-colors hover:bg-muted/50">
      {/* ── Status (coluna colapsável) ─────────────────────────────── */}
      <td
        className={`${CELL} px-2 py-2 mobile:px-1 tablet:px-1 laptop:px-2`}
        style={{ width: "1%" }}
      >
        <StatusBadge variant={statusBadge.variant} className="min-w-0 px-2">
          {statusBadge.label}
        </StatusBadge>
      </td>

      {/* ── Aluno (sticky) ─────────────────────────────────────────── */}
      <td
        className={`${CELL} ${STICKY_CELL} w-[280px] desktop:w-[360px] group-hover:bg-muted transition-colors`}
        style={{ ...STICKY_SHADOW, minWidth: COL.ALUNO }}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">
              {log.students?.name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="min-w-0 space-y-1">
            <p
              className="text-sm font-medium truncate"
              title={log.students?.name || "Aluno não encontrado"}
            >
              {log.students?.name || "Aluno não encontrado"}
            </p>
            {lastUpdatedAt && (
              <p className="text-[11px] text-muted-foreground">
                {`Editado em ${format(
                  new Date(lastUpdatedAt),
                  "dd/MM/yyyy HH:mm",
                  { locale: ptBR }
                )}`}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* ── Aula / Professor ───────────────────────────────────────── */}
      <td className={CELL} style={{ minWidth: COL.AULA_PROF }}>
        <div className="min-w-0 space-y-1">
          {log.title && (
            <p className="text-sm font-semibold text-foreground break-all whitespace-normal">
              {escapeHtml(log.title)}
            </p>
          )}
          <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={currentTeacherName}>
            {currentTeacherName}
          </p>
        </div>
      </td>

      {/* ── Data ───────────────────────────────────────────────────── */}
      <td className={`${CELL} tabular-nums`} style={{ minWidth: COL.DATA }}>
        <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
          <span>{date}</span>
          {timeRange && <span className="text-xs">{timeRange}</span>}
        </div>
      </td>

      {/* ── Nota ───────────────────────────────────────────────────── */}
      <td className={`${CELL} tabular-nums`} style={{ minWidth: COL.NOTA }}>
        <span
          className={`text-sm font-medium ${
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

      {/* ── Financeiro ─────────────────────────────────────────────── */}
      <td className={CELL} style={{ minWidth: COL.FINANCEIRO }}>
        {log.financial_records ? (
          <StatusBadge
            variant={getPaymentStatusVariant(log.financial_records.status)}
          >
            <Receipt className="h-3 w-3" />
            {getPaymentStatusLabel(log.financial_records.status)}
          </StatusBadge>
        ) : (
          <span className="text-sm text-muted-foreground">Sem cobrança</span>
        )}
      </td>

      {/* ── Valor ──────────────────────────────────────────────────── */}
      <td className={`${CELL} tabular-nums`} style={{ minWidth: COL.VALOR }}>
        <span
          className={
            log.financial_records
              ? "text-sm font-medium tabular-nums"
              : "text-sm font-medium text-foreground"
          }
        >
          {log.financial_records
            ? formatCurrency(Number(log.financial_records.amount))
            : "sem cobrança"}
        </span>
      </td>

      {/* ── Feedback ───────────────────────────────────────────────── */}
      <td className={CELL} style={{ minWidth: COL.FEEDBACK }}>
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-xs whitespace-normal">
          {log.feedback ? sanitizeText(log.feedback) : "—"}
        </span>
      </td>

      {/* ── Ações ──────────────────────────────────────────────────── */}
      <td className={CELL} style={{ minWidth: COL.ACOES }}>
        <div className="flex items-center gap-2">
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
          <Button
            size="sm"
            className={`h-8 border-none ${
              blocked && log.attendance == null
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : log.attendance != null
                  ? "bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                  : "bg-success-action text-white hover:bg-success-action/90"
            }`}
            disabled={isMutating || (blocked && log.attendance == null)}
            onClick={() => {
              if (blocked) return;
              onPostClass(log);
            }}
          >
            {blocked && log.attendance == null ? (
              <>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Avaliar
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                {log.attendance != null ? "Atualizar" : "Avaliar"}
              </>
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}
