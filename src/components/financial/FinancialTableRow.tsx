import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/formatters";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";

export const COL = {
  ALUNO: 240,
  AULA: 220,
  DESCR: 240,
  VALOR: 120,
  METODO: 120,
  VENCIMENTO: 140,
  STATUS: 120,
  AVALIAR: 120,
  ACOES: 100,
} as const;

export const TABLE_MIN_W = COL.ALUNO + COL.AULA + COL.DESCR + COL.VALOR + COL.METODO + COL.VENCIMENTO + COL.STATUS + COL.AVALIAR + COL.ACOES;

const CELL_BASE = "px-2 py-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2 align-middle text-left text-xs whitespace-nowrap";
const STICKY_CELL = "sticky left-0 z-20 bg-card group-hover:bg-muted transition-colors";
const STICKY_SHADOW = { boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" };

const statusVariants: Record<string, "success" | "warning" | "destructive" | "default"> = {
  pago: "success",
  pendente: "warning",
  atrasado: "destructive",
};

const statusLabels: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
};

interface FinancialTableRowProps {
  record: FinancialRecordWithRelations & { actualStatus: string };
  showTeacherColumn: boolean;
  teacherMap: Map<string, string>;
  isUndoing: boolean;
  onViewHistory: (record: FinancialRecordWithRelations) => void;
  onEdit: (record: FinancialRecordWithRelations) => void;
  onDelete: (record: FinancialRecordWithRelations) => void;
  onConfirmPayment: (record: FinancialRecordWithRelations) => void;
  onUndoPayment: (record: FinancialRecordWithRelations) => void;
}

export function FinancialTableRow({
  record,
  showTeacherColumn,
  teacherMap,
  isUndoing,
  onViewHistory,
  onEdit,
  onDelete,
  onConfirmPayment,
  onUndoPayment,
}: FinancialTableRowProps) {
  const lastUpdatedAt = record.updated_at || record.created_at;

  return (
    <TableRow>
      {/* Aluno (sticky) */}
      <TableCell className={`${CELL_BASE} ${STICKY_CELL}`} style={{ ...STICKY_SHADOW, width: COL.ALUNO, minWidth: COL.ALUNO }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">{record.students?.name?.charAt(0) || "?"}</span>
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate" title={record.students?.name || "—"}>{record.students?.name || "—"}</p>
          </div>
        </div>
      </TableCell>

      {/* Aula Vinculada */}
      <TableCell className={`${CELL_BASE} hidden lg:table-cell`}>
        {record.class_logs ? (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span>
              {record.students?.name}
              {" | "}
              {record.class_logs.title?.trim()
                ? record.class_logs.title
                : formatDate(record.class_logs.class_date)}
            </span>
            {showTeacherColumn && record.students?.teacher_id && (
              <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground/80">
                Professor: {teacherMap.get(record.students.teacher_id) || "—"}
              </span>
            )}
          </div>
        ) : record.package_classes && record.package_classes.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            Pacote mensal - {record.package_classes.length} aula(s)
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/70">
            Sem aula vinculada
          </span>
        )}
      </TableCell>

      {/* Descrição */}
      <TableCell className={`${CELL_BASE} hidden sm:table-cell`}>
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>
            {record.package_classes && record.package_classes.length > 0
              ? (() => {
                  const sorted = [...record.package_classes].sort((a, b) =>
                    a.class_date.localeCompare(b.class_date)
                  );
                  const first = formatDate(sorted[0].class_date);
                  const last = formatDate(sorted[sorted.length - 1].class_date);
                  return sorted.length === 1 ? first : `${first} a ${last}`;
                })()
              : (record.description || "—")}
          </span>
          {lastUpdatedAt && (
            <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] mt-0.5">
              {`Editado em ${formatDateTime(lastUpdatedAt)}`}
            </span>
          )}
        </div>
      </TableCell>

      {/* Valor */}
      <TableCell className={CELL_BASE}>
        <p className="font-semibold text-xs">
          {formatCurrency(Number(record.amount))}
        </p>
      </TableCell>

      {/* Método */}
      <TableCell className={`${CELL_BASE} hidden lg:table-cell`}>
        <p className="text-xs text-muted-foreground">
          {record.payment_method || "—"}
        </p>
      </TableCell>

      {/* Vencimento */}
      <TableCell className={`${CELL_BASE} hidden md:table-cell`}>
        <p className="text-xs text-muted-foreground">
          {formatDate(record.due_date)}
        </p>
      </TableCell>

      {/* Status */}
      <TableCell className={CELL_BASE} style={{ width: COL.STATUS, minWidth: COL.STATUS }}>
        <StatusBadge variant={statusVariants[record.actualStatus]}>
          {statusLabels[record.actualStatus]}
        </StatusBadge>
      </TableCell>

      {/* Confirm / Undo (separate column) */}
      <TableCell className={CELL_BASE} style={{ width: COL.AVALIAR, minWidth: COL.AVALIAR }}>
        <div className="flex items-center justify-end">
          {record.actualStatus !== "pago" ? (
            <Button
              size="sm"
              className="h-8 w-[7rem] shrink-0 bg-[#25D366] text-white hover:bg-[#1ebe57] border-none"
              onClick={() => onConfirmPayment(record)}
            >
              Confirmar
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 w-[7rem] shrink-0 whitespace-nowrap bg-warning text-white font-semibold hover:bg-warning/90 border-none shadow"
              disabled={isUndoing}
              onClick={() => onUndoPayment(record)}
            >
              {isUndoing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                  Desfazendo...
                </>
              ) : (
                "Desfazer"
              )}
            </Button>
          )}
        </div>
      </TableCell>

      {/* Ações (only eye + menu) */}
      <TableCell className={CELL_BASE} style={{ width: COL.ACOES, minWidth: COL.ACOES }}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewHistory(record)}
            title="Ver histórico de pagamento"
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
              <DropdownMenuItem onClick={() => onEdit(record)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(record)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
      <TableCell style={{ width: 'auto' }}></TableCell>
    </TableRow>
  );
}
