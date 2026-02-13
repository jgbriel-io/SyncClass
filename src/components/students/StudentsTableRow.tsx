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

export const COL = {
  ALUNO: 280,
  PROFESSOR: 200,
  VALOR_HORA: 120,
  AULAS_SEMANA: 120,
  TOTAL_MENSAL: 140,
  DIA_PAGTO: 100,
  FINANCEIRO: 140,
  ULTIMA_AULA: 150,
  ACOES: 100,
} as const;

export const TABLE_MIN_W =
  COL.ALUNO + COL.PROFESSOR + COL.VALOR_HORA + COL.AULAS_SEMANA + COL.TOTAL_MENSAL + COL.DIA_PAGTO + COL.FINANCEIRO + COL.ULTIMA_AULA + COL.ACOES;

const CELL_BASE = "px-2 py-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2 align-middle text-left text-xs whitespace-nowrap";
const STICKY_CELL = "sticky left-0 z-20 bg-card group-hover:bg-muted transition-colors";
const STICKY_SHADOW = { boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" };

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
      <td className="px-2 py-2 align-middle whitespace-nowrap" style={{ width: '1%' }}>
        <StatusBadge variant={student.status === "ativo" ? "success" : "default"}>
          {student.status === "ativo" ? "Ativo" : "Inativo"}
        </StatusBadge>
      </td>

      {/* Aluno — sticky */}
      <td
        className={`${CELL_BASE} ${STICKY_CELL} w-[280px] min-w-[280px] max-w-[280px] desktop:w-[360px] desktop:min-w-[360px] desktop:max-w-[360px]`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">{student.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" title={student.name}>{student.name}</p>
            {lastUpdatedAt && (
              <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5">
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

      <td className={CELL_BASE} style={{ width: COL.VALOR_HORA, minWidth: COL.VALOR_HORA }}>
        <span className="text-muted-foreground">{hourlyRate != null ? formatCurrency(hourlyRate) : "—"}</span>
      </td>

      <td className={CELL_BASE} style={{ width: COL.AULAS_SEMANA, minWidth: COL.AULAS_SEMANA }}>
        <span className="text-muted-foreground">{classesPerWeek ?? "—"}</span>
      </td>

      <td className={CELL_BASE} style={{ width: COL.TOTAL_MENSAL, minWidth: COL.TOTAL_MENSAL }}>
        <span className="text-muted-foreground">{monthlyTotal != null ? formatCurrency(monthlyTotal) : "—"}</span>
      </td>

      <td className={CELL_BASE} style={{ width: COL.DIA_PAGTO, minWidth: COL.DIA_PAGTO }}>
        <span className="text-muted-foreground">{student.pay_day ?? "—"}</span>
      </td>

      <td className={CELL_BASE} style={{ width: COL.FINANCEIRO, minWidth: COL.FINANCEIRO }}>
        {financialStatus ? (
          <StatusBadge variant={financialStatus.variant}>{financialStatus.label}</StatusBadge>
        ) : (
          <span className="text-muted-foreground">Sem cobranças</span>
        )}
      </td>

      <td className={CELL_BASE} style={{ width: COL.ULTIMA_AULA, minWidth: COL.ULTIMA_AULA }}>
        <div className="space-y-0.5">
          <span className="text-muted-foreground block">{lastClassDateRaw ? format(new Date(lastClassDateRaw + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}</span>
          {daysWithoutClass !== null && (
            <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground block">{daysWithoutClass} dia{daysWithoutClass === 1 ? "" : "s"} sem aula</span>
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
