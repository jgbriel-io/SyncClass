import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { NumericCell } from "@/components/ui/numeric-cell";
import { formatDate, formatDateTime } from "@/lib/utils/formatters";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Eye, Loader2, Trash2 } from "lucide-react";
import { FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL } from "./FinancialTableRow.constants";

const statusVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  pago: "success",
  pendente: "warning",
  atrasado: "destructive",
  abonado: "default",
  extornado: "default",
  cancelado: "default",
};

const statusLabels: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
  abonado: "Abonado",
  extornado: "Extornado",
  cancelado: "Cancelado",
};

interface FinancialTableRowProps {
  record: FinancialRecordWithRelations & { actualStatus: string };
  showTeacherColumn: boolean;
  teacherMap: Map<string, string>;
  isUndoing: boolean;
  onViewHistory: (record: FinancialRecordWithRelations) => void;
  onEdit: (record: FinancialRecordWithRelations) => void;
  onConfirmPayment: (record: FinancialRecordWithRelations) => void;
  onUndoPayment: (record: FinancialRecordWithRelations) => void;
  onDelete?: (record: FinancialRecordWithRelations) => void;
}

export function FinancialTableRow({
  record,
  showTeacherColumn,
  teacherMap,
  isUndoing,
  onViewHistory,
  onEdit,
  onConfirmPayment,
  onUndoPayment,
  onDelete,
}: FinancialTableRowProps) {
  const lastUpdatedAt = record.updated_at || record.created_at;
  
  // Pode deletar apenas se não houver aula vinculada (class_log_id é null)
  const canDelete = !record.class_log_id && onDelete;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Aluno (sticky) - XL */}
      <td className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`} style={STICKY_SHADOW}>
        <div className="flex items-center gap-4 overflow-hidden">
          <AvatarCircle name={record.students?.name || "?"} />
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
      <td className={CELL_BASE} style={{ width: COL.VALOR, minWidth: COL.VALOR }}>
        <NumericCell value={Number(record.amount)} format="currency" className="font-semibold" />
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
          {record.actualStatus === "pago" ? (
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
          ) : record.actualStatus === "abonado" || record.actualStatus === "extornado" || record.actualStatus === "cancelado" ? (
            <Button
              size="sm"
              className="h-8 w-[7rem] shrink-0 text-xs"
              disabled
              variant="ghost"
              title="Cobrança finalizada"
            >
              Finalizado
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 w-[7rem] shrink-0 bg-success-action text-white hover:bg-success-action/90 border-none text-xs"
              onClick={() => onConfirmPayment(record)}
              title="Confirmar"
            >
              Confirmar
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
            aria-label="Ver histórico de pagamento"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Mais opções">
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(record)}>
                <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                Editar
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(record)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
