import { common, financial } from "@/content";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { NumericCell } from "@/components/ui/numeric-cell";
import { formatDate, formatDateTime } from "@/lib/utils/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Eye, Trash2, Ban } from "lucide-react";
import { FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL } from "./FinancialTableRow.constants";

const statusVariants: Record<
  string,
  "success" | "warning" | "destructive" | "default" | "secondary"
> = {
  pago: "success",
  pendente: "warning",
  atrasado: "destructive",
  validando: "warning",
  abonado: "default",
  extornado: "default",
  cancelado: "default",
};

const statusLabels: Record<string, string> = {
  pago: financial.tableRow.statusPaid,
  pendente: financial.tableRow.statusPending,
  atrasado: financial.tableRow.statusOverdue,
  validando: financial.tableRow.statusValidating,
  abonado: financial.tableRow.statusAbonado,
  extornado: financial.tableRow.statusExtornado,
  cancelado: financial.tableRow.statusCanceled,
};

const paymentMethodLabels: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  outro: "Outro",
};

function getPaymentMethodLabel(
  payment_provider: string | null | undefined,
  payment_method: string | null | undefined
): string {
  if (payment_provider === "abacate_pay") return "Pix - AbacatePay";
  if (payment_method)
    return paymentMethodLabels[payment_method] ?? payment_method;
  return "—";
}

interface FinancialTableRowProps {
  record: FinancialRecordWithRelations & { actualStatus: string };
  showTeacherColumn: boolean;
  teacherMap: Map<string, string>;
  onViewHistory: (record: FinancialRecordWithRelations) => void;
  onEdit: (record: FinancialRecordWithRelations) => void;
  onRequestRefund?: (record: FinancialRecordWithRelations) => void;
  onCancelCharge?: (record: FinancialRecordWithRelations) => void;
  onDelete?: (record: FinancialRecordWithRelations) => void;
  isAdmin?: boolean;
}

export function FinancialTableRow({
  record,
  showTeacherColumn,
  teacherMap,
  onViewHistory,
  onEdit,
  onRequestRefund,
  onCancelCharge,
  onDelete,
  isAdmin = false,
}: FinancialTableRowProps) {
  const lastUpdatedAt = record.updated_at || record.created_at;

  const TERMINAL_STATUSES = ["abonado", "extornado", "cancelado"];

  const canDelete =
    onDelete &&
    record.actualStatus !== "pago" &&
    !TERMINAL_STATUSES.includes(record.actualStatus) &&
    record.record_type !== "avulsa";

  const canCancel =
    !isAdmin &&
    onCancelCharge &&
    !TERMINAL_STATUSES.includes(record.actualStatus) &&
    record.actualStatus !== "pago";

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      <td
        className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <AvatarCircle name={record.students?.name || "?"} />
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium truncate"
              title={record.students?.name || "—"}
            >
              {record.students?.name || "—"}
            </p>
            {lastUpdatedAt && (
              <p
                className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate"
                title={`${financial.tableRow.editedAt} ${formatDateTime(lastUpdatedAt)}`}
              >
                {`${financial.tableRow.editedAt} ${formatDateTime(lastUpdatedAt)}`}
              </p>
            )}
          </div>
        </div>
      </td>

      <td
        className={`${CELL_BASE} hidden lg:table-cell`}
        style={{ width: COL.AULA, minWidth: COL.AULA }}
      >
        {record.class_logs ? (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span
              className="truncate"
              title={`${record.students?.name} | ${record.class_logs.title?.trim() ? record.class_logs.title : formatDate(record.class_logs.class_date)}`}
            >
              {record.students?.name}
              {" | "}
              {record.class_logs.title?.trim()
                ? record.class_logs.title
                : formatDate(record.class_logs.class_date)}
            </span>
            {showTeacherColumn && record.students?.teacher_id && (
              <span
                className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground/80 truncate"
                title={`${financial.tableRow.teacher} ${teacherMap.get(record.students.teacher_id) || "—"}`}
              >
                {financial.tableRow.teacher}{" "}
                {teacherMap.get(record.students.teacher_id) || "—"}
              </span>
            )}
          </div>
        ) : record.record_type === "pacote" &&
          record.package_classes &&
          record.package_classes.length > 0 ? (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span
              className="truncate"
              title={`${financial.tableRow.packageMonthly} - ${record.package_classes.length} ${financial.tableRow.classes}`}
            >
              {financial.tableRow.packageMonthly} -{" "}
              {record.package_classes.length} {financial.tableRow.classes}
            </span>
            <span
              className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] mt-0.5 truncate"
              title={(() => {
                const sorted = [...record.package_classes].sort((a, b) =>
                  a.class_date.localeCompare(b.class_date)
                );
                const first = formatDate(sorted[0].class_date);
                const last = formatDate(sorted[sorted.length - 1].class_date);
                return sorted.length === 1 ? first : `${first} a ${last}`;
              })()}
            >
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
          <span
            className="text-xs text-muted-foreground/70 truncate block"
            title={financial.tableRow.noClass}
          >
            {financial.tableRow.noClass}
          </span>
        )}
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.VALOR, minWidth: COL.VALOR }}
      >
        <NumericCell
          value={Number(record.amount)}
          format="currency"
          className="font-semibold"
        />
      </td>

      <td
        className={`${CELL_BASE} hidden lg:table-cell`}
        style={{ width: COL.METODO, minWidth: COL.METODO }}
      >
        <p
          className="text-xs text-muted-foreground truncate"
          title={getPaymentMethodLabel(
            record.payment_provider,
            record.payment_method
          )}
        >
          {getPaymentMethodLabel(
            record.payment_provider,
            record.payment_method
          )}
        </p>
      </td>

      <td
        className={`${CELL_BASE} hidden md:table-cell tabular-nums`}
        style={{ width: COL.VENCIMENTO, minWidth: COL.VENCIMENTO }}
      >
        <p
          className="text-xs text-muted-foreground truncate"
          title={formatDate(record.due_date)}
        >
          {formatDate(record.due_date)}
        </p>
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.STATUS, minWidth: COL.STATUS }}
      >
        <StatusBadge variant={statusVariants[record.actualStatus]}>
          {statusLabels[record.actualStatus]}
        </StatusBadge>
      </td>

      {!isAdmin && (
        <td
          className={CELL_BASE}
          style={{ width: COL.AVALIAR, minWidth: COL.AVALIAR }}
        >
          <div className="flex items-center justify-end">
            {record.actualStatus === "pago" && onRequestRefund ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-[7rem] shrink-0 whitespace-nowrap text-xs"
                onClick={() => onRequestRefund(record)}
                title={financial.tableRow.requestRefund}
              >
                {financial.tableRow.requestRefund}
              </Button>
            ) : record.actualStatus === "abonado" ||
              record.actualStatus === "extornado" ||
              record.actualStatus === "cancelado" ? (
              <Button
                size="sm"
                className="h-8 w-[7rem] shrink-0 text-xs"
                disabled
                variant="ghost"
                title={financial.tableRow.finalized}
              >
                {financial.tableRow.finalized}
              </Button>
            ) : null}
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
            onClick={() => onViewHistory(record)}
            title={financial.tableRow.viewHistory}
            aria-label={financial.tableRow.viewHistory}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
          {!isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={financial.tableRow.moreOptions}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(record)}>
                  <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                  {financial.tableRow.edit}
                </DropdownMenuItem>
                {canCancel && (
                  <DropdownMenuItem
                    onClick={() => onCancelCharge(record)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" aria-hidden="true" />
                    {financial.tableRow.cancelCharge}
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(record)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    {financial.tableRow.delete}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </td>
    </tr>
  );
}
