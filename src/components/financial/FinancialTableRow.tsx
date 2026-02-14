import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/formatters";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { sanitizeText } from "@/lib/utils/sanitize";
import { MoreHorizontal, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL } from "./FinancialTableRow.constants";

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
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Aluno (sticky) - XL */}
      <td className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`} style={STICKY_SHADOW}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">{record.students?.name?.charAt(0) || "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" title={record.students?.name || "—"}>{record.students?.name || "—"}</p>
            {lastUpdatedAt && (
              <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate" title={`Editado em ${formatDateTime(lastUpdatedAt)}`}>
                {`Editado em ${formatDateTime(lastUpdatedAt)}`}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Aula Vinculada - L */}
      <td className={`${CELL_BASE} hidden lg:table-cell`} style={{ width: COL.AULA, minWidth: COL.AULA }}>
        {record.class_logs ? (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span className="truncate" title={`${record.students?.name} | ${record.class_logs.title?.trim() ? record.class_logs.title : formatDate(record.class_logs.class_date)}`}>
              {record.students?.name}
              {" | "}
              {record.class_logs.title?.trim()
                ? record.class_logs.title
                : formatDate(record.class_logs.class_date)}
            </span>
            {showTeacherColumn && record.students?.teacher_id && (
              <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground/80 truncate" title={`Professor: ${teacherMap.get(record.students.teacher_id) || "—"}`}>
                Professor: {teacherMap.get(record.students.teacher_id) || "—"}
              </span>
            )}
          </div>
        ) : record.package_classes && record.package_classes.length > 0 ? (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span className="truncate" title={`Pacote mensal - ${record.package_classes.length} aula(s)`}>
              Pacote mensal - {record.package_classes.length} aula(s)
            </span>
            <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] mt-0.5 truncate" title={(() => {
              const sorted = [...record.package_classes].sort((a, b) =>
                a.class_date.localeCompare(b.class_date)
              );
              const first = formatDate(sorted[0].class_date);
              const last = formatDate(sorted[sorted.length - 1].class_date);
              return sorted.length === 1 ? first : `${first} a ${last}`;
            })()}>
              {(() => {
                const sorted = [...record.package_classes].sort((a, b) =>
                  a.class_date.localeCompare(b.class_date)
                );
                const first = formatDate(sorted[0].class_date);
                const last = formatDate(sorted[sorted.length - 1].class_date);
                return sorted.length === 1 ? first : `${first} a ${last}`;
              })()}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/70 truncate block" title="Sem aula vinculada">
            Sem aula vinculada
          </span>
        )}
      </td>

      {/* Valor - S */}
      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.VALOR, minWidth: COL.VALOR }}>
        <p className="font-semibold text-xs truncate" title={formatCurrency(Number(record.amount))}>
          {formatCurrency(Number(record.amount))}
        </p>
      </td>

      {/* Método - S */}
      <td className={`${CELL_BASE} hidden lg:table-cell`} style={{ width: COL.METODO, minWidth: COL.METODO }}>
        <p className="text-xs text-muted-foreground truncate" title={record.payment_method || "—"}>
          {record.payment_method || "—"}
        </p>
      </td>

      {/* Vencimento - M */}
      <td className={`${CELL_BASE} hidden md:table-cell tabular-nums`} style={{ width: COL.VENCIMENTO, minWidth: COL.VENCIMENTO }}>
        <p className="text-xs text-muted-foreground truncate" title={formatDate(record.due_date)}>
          {formatDate(record.due_date)}
        </p>
      </td>

      {/* Status - M */}
      <td className={CELL_BASE} style={{ width: COL.STATUS, minWidth: COL.STATUS }}>
        <StatusBadge variant={statusVariants[record.actualStatus]}>
          {statusLabels[record.actualStatus]}
        </StatusBadge>
      </td>

      {/* Confirm / Undo - S */}
      <td className={CELL_BASE} style={{ width: COL.AVALIAR, minWidth: COL.AVALIAR }}>
        <div className="flex items-center justify-end">
          {record.actualStatus !== "pago" ? (
            <Button
              size="sm"
              className="h-8 w-[7rem] shrink-0 bg-[#25D366] text-white hover:bg-[#1ebe57] border-none text-xs"
              onClick={() => onConfirmPayment(record)}
              title="Confirmar"
            >
              Confirmar
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 w-[7rem] shrink-0 whitespace-nowrap bg-warning text-white font-semibold hover:bg-warning/90 border-none shadow text-xs"
              disabled={isUndoing}
              onClick={() => onUndoPayment(record)}
              title={isUndoing ? "Desfazendo..." : "Desfazer"}
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
      </td>

      {/* Ações - XS */}
      <td className={CELL_BASE} style={{ width: COL.ACOES, minWidth: COL.ACOES }}>
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
      </td>
    </tr>
  );
}
