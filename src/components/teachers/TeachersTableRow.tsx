import { common } from "@/content";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
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
  Check,
  KeyRound,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils/formatters";
import { formatPhoneDisplay } from "@/lib/utils/format-phone";
import type { Teacher } from "@/hooks/useTeachers";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL } from "./TeachersTableRow.constants";
import { teachers as teachersContent } from "@/content";

interface TeachersTableRowProps {
  teacher: Teacher;
  studentCount: number;
  totalClasses: number;
  totalReceived: number;
  onViewDetail: (teacherId: string) => void;
  onEdit: (teacher: Teacher) => void;
  onResetPassword: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onHardDelete: (teacher: Teacher) => void;
  showHardDelete?: boolean;
}

export function TeachersTableRow({
  teacher,
  studentCount,
  totalClasses,
  totalReceived,
  onViewDetail,
  onEdit,
  onResetPassword,
  onDelete,
  onHardDelete,
  showHardDelete = true,
}: TeachersTableRowProps) {
  const status = teacher.status ?? "ativo";
  const lastUpdatedAt = teacher.updated_at;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Status Badge */}
      <td
        className="px-2 py-2 align-middle whitespace-nowrap"
        style={{ width: "1%" }}
      >
        <StatusBadge variant={status === "inativo" ? "default" : "success"}>
          {status === "inativo"
            ? teachersContent.table.statusInactive
            : teachersContent.table.statusActive}
        </StatusBadge>
      </td>

      {/* Nome — sticky XL */}
      <td
        className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">
              {teacher.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" title={teacher.name}>
              {teacher.name}
            </p>
            {lastUpdatedAt && (
              <p
                className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate"
                title={`${teachersContent.table.editedAt} ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              >
                {`${teachersContent.table.editedAt} ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Email - L */}
      <td
        className={CELL_BASE}
        style={{ width: COL.EMAIL, minWidth: COL.EMAIL }}
      >
        <span className="text-xs truncate block" title={teacher.email || "—"}>
          {teacher.email || "—"}
        </span>
      </td>

      {/* Telefone - M */}
      <td
        className={CELL_BASE}
        style={{ width: COL.TELEFONE, minWidth: COL.TELEFONE }}
      >
        <span
          className="text-xs truncate block"
          title={formatPhoneDisplay(teacher.phone, "Brasil") || "—"}
        >
          {formatPhoneDisplay(teacher.phone, "Brasil") || "—"}
        </span>
      </td>

      {/* Total Alunos - S */}
      <td
        className={`${CELL_BASE} tabular-nums`}
        style={{ width: COL.TOTAL_ALUNOS, minWidth: COL.TOTAL_ALUNOS }}
      >
        <div className="flex items-center justify-center">
          <span
            className="text-xs font-medium truncate"
            title={String(studentCount)}
          >
            {studentCount}
          </span>
        </div>
      </td>

      {/* Total Aulas - S */}
      <td
        className={`${CELL_BASE} tabular-nums`}
        style={{ width: COL.TOTAL_AULAS, minWidth: COL.TOTAL_AULAS }}
      >
        <div className="flex items-center justify-center">
          <span
            className="text-xs font-medium truncate"
            title={String(totalClasses)}
          >
            {totalClasses}
          </span>
        </div>
      </td>

      {/* Valor Recebido - M */}
      <td
        className={`${CELL_BASE} tabular-nums`}
        style={{ width: COL.VALOR_RECEBIDO, minWidth: COL.VALOR_RECEBIDO }}
      >
        <span
          className="text-xs font-medium text-success truncate block"
          title={formatCurrency(totalReceived)}
        >
          {formatCurrency(totalReceived)}
        </span>
      </td>

      {/* Placeholder - S (coluna vazia) */}
      <td
        className={CELL_BASE}
        style={{ width: COL.PLACEHOLDER, minWidth: COL.PLACEHOLDER }}
      >
        {/* Espaço reservado */}
      </td>

      {/* Ações - XS */}
      <td
        className={CELL_BASE}
        style={{ width: COL.ACOES, minWidth: COL.ACOES }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetail(teacher.id)}
            title={common.buttons.viewDetails}
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
              <DropdownMenuItem onClick={() => onEdit(teacher)}>
                <Pencil className="h-4 w-4 mr-2" />
                {common.actions.edit}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(teacher)}>
                <KeyRound className="h-4 w-4 mr-2" />
                {common.actions.resetPassword}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={
                  status === "ativo"
                    ? "text-destructive focus:text-destructive"
                    : "focus:text-primary"
                }
                onClick={() => onDelete(teacher)}
              >
                {status === "ativo" && <Trash2 className="h-4 w-4 mr-2" />}
                {status === "ativo" ? (
                  teachersContent.statusDialog.confirmArchive
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {teachersContent.statusDialog.confirmReactivate}
                  </>
                )}
              </DropdownMenuItem>
              {showHardDelete && status === "inativo" && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onHardDelete(teacher)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {teachersContent.deleteDialog.confirmButton}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
