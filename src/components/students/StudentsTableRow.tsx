import { common, students as studentsContent } from "@/content";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { NumericCell } from "@/components/ui/numeric-cell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DotsThree as MoreHorizontal,
  Pencil,
  Trash as Trash2,
  Eye,
  Key as KeyRound,
  Check,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Student } from "@/hooks/useStudents";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL } from "./StudentsTableRow.constants";

interface StudentsTableRowProps {
  student: Student;
  showTeacherColumn: boolean;
  teacherName: string;
  totalClasses: number;
  monthlyTotal: number | null;
  lastClassDateRaw: string | null;
  daysWithoutClass: number | null;
  financialStatus: {
    label: string;
    variant: "default" | "success" | "warning" | "destructive";
  } | null;
  onViewDetail: (studentId: string) => void;
  onEdit: (student: Student) => void;
  onResetPassword: (student: Student) => void;
  onArchive: (student: Student) => void;
  onHardDelete: (student: Student) => void;
  showHardDelete?: boolean;
  isAnonymized?: boolean;
}

export function StudentsTableRow({
  student,
  showTeacherColumn,
  teacherName,
  totalClasses,
  monthlyTotal,
  lastClassDateRaw,
  daysWithoutClass,
  financialStatus,
  onViewDetail,
  onEdit,
  onResetPassword,
  onArchive,
  onHardDelete,
  showHardDelete = true,
  isAnonymized = false,
}: StudentsTableRowProps) {
  const lastUpdatedAt = student.updated_at;
  const hourlyRate = student.hourly_rate;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Status Badge */}
      <td className={CELL_BASE} style={{ width: "1%" }}>
        {isAnonymized ? (
          <StatusBadge variant="destructive">
            {studentsContent.table.statusAnonymized}
          </StatusBadge>
        ) : (
          <StatusBadge
            variant={student.status === "ativo" ? "success" : "default"}
          >
            {student.status === "ativo"
              ? studentsContent.table.statusActive
              : studentsContent.table.statusInactive}
          </StatusBadge>
        )}
      </td>

      {/* Aluno — sticky XL */}
      <td
        className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <AvatarCircle name={student.name} avatarUrl={student.avatar_url} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" title={student.name}>
              {student.name}
            </p>
            {lastUpdatedAt && (
              <p
                className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate"
                title={`${studentsContent.table.editedAt} ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              >
                {`${studentsContent.table.editedAt} ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              </p>
            )}
          </div>
        </div>
      </td>

      {showTeacherColumn && (
        <td
          className={CELL_BASE}
          style={{ width: COL.PROFESSOR, minWidth: COL.PROFESSOR }}
        >
          <span
            className="text-muted-foreground truncate block"
            title={teacherName}
          >
            {teacherName}
          </span>
        </td>
      )}

      <td
        className={CELL_BASE}
        style={{ width: COL.VALOR_HORA, minWidth: COL.VALOR_HORA }}
      >
        <NumericCell
          value={hourlyRate}
          format="currency"
          className="text-muted-foreground"
        />
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.AULAS_SEMANA, minWidth: COL.AULAS_SEMANA }}
      >
        <NumericCell value={totalClasses} className="text-muted-foreground" />
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.TOTAL_MENSAL, minWidth: COL.TOTAL_MENSAL }}
      >
        <NumericCell
          value={monthlyTotal}
          format="currency"
          className="text-muted-foreground"
        />
      </td>

      <td
        className={`${CELL_BASE} tabular-nums`}
        style={{ width: COL.DIA_PAGTO, minWidth: COL.DIA_PAGTO }}
      >
        <span
          className="text-muted-foreground truncate block"
          title={String(student.pay_day ?? "—")}
        >
          {student.pay_day ?? "—"}
        </span>
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.FINANCEIRO, minWidth: COL.FINANCEIRO }}
      >
        {financialStatus ? (
          <StatusBadge variant={financialStatus.variant}>
            {financialStatus.label}
          </StatusBadge>
        ) : (
          <span
            className="text-muted-foreground truncate block"
            title={studentsContent.table.noCharges}
          >
            {studentsContent.table.noCharges}
          </span>
        )}
      </td>

      <td
        className={`${CELL_BASE} tabular-nums`}
        style={{ width: COL.ULTIMA_AULA, minWidth: COL.ULTIMA_AULA }}
      >
        <div className="space-y-0.5">
          <span
            className="text-muted-foreground block truncate"
            title={
              lastClassDateRaw
                ? format(
                    new Date(lastClassDateRaw + "T00:00:00"),
                    "dd/MM/yyyy",
                    { locale: ptBR }
                  )
                : "—"
            }
          >
            {lastClassDateRaw
              ? format(new Date(lastClassDateRaw + "T00:00:00"), "dd/MM/yyyy", {
                  locale: ptBR,
                })
              : "—"}
          </span>
          {daysWithoutClass !== null && (
            <span
              className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground block truncate"
              title={studentsContent.table.daysWithoutClass(daysWithoutClass)}
            >
              {studentsContent.table.daysWithoutClass(daysWithoutClass)}
            </span>
          )}
        </div>
      </td>

      <td
        className={CELL_BASE}
        style={{ width: COL.ACOES, minWidth: COL.ACOES }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetail(student.id)}
            title={common.buttons.viewDetails}
            aria-label={common.aria.moreOptions}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
          {!isAnonymized && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={common.aria.moreOptions}
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(student)}>
                  <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                  {common.actions.edit}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onResetPassword(student)}>
                  <KeyRound className="h-4 w-4 mr-2" aria-hidden="true" />
                  {common.actions.resetPassword}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={
                    student.status === "ativo"
                      ? "text-destructive focus:text-destructive"
                      : "focus:text-primary"
                  }
                  onClick={() => onArchive(student)}
                >
                  {student.status === "ativo" && (
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {student.status === "ativo" ? (
                    studentsContent.archiveDialog.confirmArchive
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                      {studentsContent.archiveDialog.confirmReactivate}
                    </>
                  )}
                </DropdownMenuItem>
                {showHardDelete && student.status === "inativo" && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onHardDelete(student)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    {studentsContent.deleteDialog.confirmButton}
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
