import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye, KeyRound, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils/formatters";
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
  monthlyTotal: number | null;
  lastClassDateRaw: string | null;
  daysWithoutClass: number | null;
  financialStatus: { label: string; variant: "default" | "success" | "warning" | "destructive" } | null;
  onViewDetail: (studentId: string) => void;
  onEdit: (student: Student) => void;
  onResetPassword: (student: Student) => void;
  onArchive: (student: Student) => void;
  onHardDelete: (student: Student) => void;
}

export function StudentsTableRow({
  student,
  showTeacherColumn,
  teacherName,
  monthlyTotal,
  lastClassDateRaw,
  daysWithoutClass,
  financialStatus,
  onViewDetail,
  onEdit,
  onResetPassword,
  onArchive,
  onHardDelete,
}: StudentsTableRowProps) {
  const lastUpdatedAt = student.updated_at;
  const hourlyRate = student.hourly_rate;
  const classesPerWeek = student.classes_per_week;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Status Badge */}
      <td className={CELL_BASE} style={{ width: '1%' }}>
        <StatusBadge variant={student.status === "ativo" ? "success" : "default"}>
          {student.status === "ativo" ? "Ativo" : "Inativo"}
        </StatusBadge>
      </td>

      {/* Aluno — sticky XL */}
      <td
        className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">{student.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" title={student.name}>{student.name}</p>
            {lastUpdatedAt && (
              <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate" title={`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}>
                {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              </p>
            )}
          </div>
        </div>
      </td>

      {showTeacherColumn && (
        <td className={CELL_BASE} style={{ width: COL.PROFESSOR, minWidth: COL.PROFESSOR }}>
          <span className="text-muted-foreground truncate block" title={teacherName}>{teacherName}</span>
        </td>
      )}

      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.VALOR_HORA, minWidth: COL.VALOR_HORA }}>
        <span className="text-muted-foreground truncate block" title={hourlyRate != null ? formatCurrency(hourlyRate) : "—"}>{hourlyRate != null ? formatCurrency(hourlyRate) : "—"}</span>
      </td>

      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.AULAS_SEMANA, minWidth: COL.AULAS_SEMANA }}>
        <span className="text-muted-foreground truncate block" title={String(classesPerWeek ?? "—")}>{classesPerWeek ?? "—"}</span>
      </td>

      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.TOTAL_MENSAL, minWidth: COL.TOTAL_MENSAL }}>
        <span className="text-muted-foreground truncate block" title={monthlyTotal != null ? formatCurrency(monthlyTotal) : "—"}>{monthlyTotal != null ? formatCurrency(monthlyTotal) : "—"}</span>
      </td>

      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.DIA_PAGTO, minWidth: COL.DIA_PAGTO }}>
        <span className="text-muted-foreground truncate block" title={String(student.pay_day ?? "—")}>{student.pay_day ?? "—"}</span>
      </td>

      <td className={CELL_BASE} style={{ width: COL.FINANCEIRO, minWidth: COL.FINANCEIRO }}>
        {financialStatus ? (
          <StatusBadge variant={financialStatus.variant}>{financialStatus.label}</StatusBadge>
        ) : (
          <span className="text-muted-foreground truncate block" title="Sem cobranças">Sem cobranças</span>
        )}
      </td>

      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.ULTIMA_AULA, minWidth: COL.ULTIMA_AULA }}>
        <div className="space-y-0.5">
          <span className="text-muted-foreground block truncate" title={lastClassDateRaw ? format(new Date(lastClassDateRaw + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}>{lastClassDateRaw ? format(new Date(lastClassDateRaw + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}</span>
          {daysWithoutClass !== null && (
            <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground block truncate" title={`${daysWithoutClass} dia${daysWithoutClass === 1 ? "" : "s"} sem aula`}>{daysWithoutClass} dia{daysWithoutClass === 1 ? "" : "s"} sem aula</span>
          )}
        </div>
      </td>

      <td className={CELL_BASE} style={{ width: COL.ACOES, minWidth: COL.ACOES }}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetail(student.id)} title="Ver detalhes">
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(student)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(student)}>
                <KeyRound className="h-4 w-4 mr-2" />
                Redefinir senha
              </DropdownMenuItem>
              <DropdownMenuItem className={student.status === "ativo" ? "text-destructive focus:text-destructive" : "focus:text-primary"} onClick={() => onArchive(student)}>
                {student.status === "ativo" && <Trash2 className="h-4 w-4 mr-2" />}
                {student.status === "ativo" ? "Arquivar" : (<><Check className="h-4 w-4 mr-2" />Reativar aluno</>)}
              </DropdownMenuItem>
              {student.status === "inativo" && (
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onHardDelete(student)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir definitivamente
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
