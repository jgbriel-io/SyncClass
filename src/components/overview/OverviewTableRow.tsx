import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, TrendingDown } from "lucide-react";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL } from "./OverviewTableRow.constants";

interface StudentWithStats {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  created_at?: string | null;
  stats: {
    totalClasses: number;
    attendanceRate: number | null;
    averageGrade: number | null;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
  };
}

interface OverviewTableRowProps {
  student: StudentWithStats;
  onViewStudent: (studentId: string) => void;
}

export function OverviewTableRow({ student, onViewStudent }: OverviewTableRowProps) {
  const hasOverdue = student.stats.totalOverdue > 0;
  const lowAttendance =
    student.stats.attendanceRate !== null &&
    student.stats.attendanceRate < 75;

  const formatSince = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const created = new Date(dateStr);
    if (isNaN(created.getTime())) return "—";
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return "há 0 dias";
    if (diffDays < 30) return `há ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    const monthLabel = `mês${months === 1 ? "" : "es"}`;
    const dayLabel = days === 0 ? "" : ` e ${days} dia${days === 1 ? "" : "s"}`;
    return `há ${months} ${monthLabel}${dayLabel}`;
  };

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Aluno — sticky XL */}
      <td className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`} style={STICKY_SHADOW}>
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">
              {student.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" title={student.name}>
              {student.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate" title={student.email || student.phone || "—"}>
              {student.email || student.phone || "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Entrada - M */}
      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.ENTRADA, minWidth: COL.ENTRADA }}>
        <span className="text-xs text-muted-foreground truncate block" title={formatSince(student.created_at)}>
          {formatSince(student.created_at)}
        </span>
      </td>

      {/* Aulas - S */}
      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.AULAS, minWidth: COL.AULAS }}>
        <span className="text-xs font-medium truncate block" title={String(student.stats.totalClasses)}>
          {student.stats.totalClasses}
        </span>
      </td>

      {/* Frequência - M */}
      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.FREQUENCIA, minWidth: COL.FREQUENCIA }}>
        <div className="flex items-center gap-1">
          {student.stats.attendanceRate !== null ? (
            <>
              {lowAttendance ? (
                <TrendingDown className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-success flex-shrink-0" />
              )}
              <span
                className={`text-xs font-medium truncate ${
                  lowAttendance
                    ? "text-rose-600"
                    : "text-success"
                }`}
                title={`${student.stats.attendanceRate.toFixed(0)}%`}
              >
                {student.stats.attendanceRate.toFixed(0)}%
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground truncate" title="—">
              —
            </span>
          )}
        </div>
      </td>

      {/* Média - S */}
      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.MEDIA, minWidth: COL.MEDIA }}>
        {student.stats.averageGrade !== null ? (
          <span
            className={`text-xs font-medium truncate block ${
              student.stats.averageGrade >= 7
                ? "text-success"
                : student.stats.averageGrade >= 5
                ? "text-amber-600"
                : "text-rose-600"
            }`}
            title={student.stats.averageGrade.toFixed(1)}
          >
            {student.stats.averageGrade.toFixed(1)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground truncate block" title="—">
            —
          </span>
        )}
      </td>

      {/* Pago - S */}
      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.PAGO, minWidth: COL.PAGO }}>
        <span className="text-xs text-success font-medium truncate block" title={formatCurrency(student.stats.totalPaid)}>
          {formatCurrency(student.stats.totalPaid)}
        </span>
      </td>

      {/* Pendente - S */}
      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.PENDENTE, minWidth: COL.PENDENTE }}>
        <span className="text-xs text-amber-600 font-medium truncate block" title={formatCurrency(student.stats.totalPending)}>
          {formatCurrency(student.stats.totalPending)}
        </span>
      </td>

      {/* Atrasado - S */}
      <td className={`${CELL_BASE} tabular-nums`} style={{ width: COL.ATRASADO, minWidth: COL.ATRASADO }}>
        <span
          className={`text-xs font-medium truncate block ${
            hasOverdue ? "text-rose-600" : "text-muted-foreground"
          }`}
          title={formatCurrency(student.stats.totalOverdue)}
        >
          {formatCurrency(student.stats.totalOverdue)}
        </span>
      </td>

      {/* Ações - XS */}
      <td className={CELL_BASE} style={{ width: COL.ACOES, minWidth: COL.ACOES }}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewStudent(student.id)}
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
