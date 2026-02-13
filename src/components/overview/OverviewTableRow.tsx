import { formatCurrency } from "@/lib/utils/formatters";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, TrendingDown } from "lucide-react";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";

export const COL = {
  ALUNO: 240,
  STATUS: 'auto' as const,
  ENTRADA: 140,
  AULAS: 100,
  FREQUENCIA: 120,
  MEDIA: 100,
  PAGO: 120,
  PENDENTE: 120,
  ATRASADO: 120,
  ACOES: 100,
} as const;

export const TABLE_MIN_W =
  COL.ALUNO +
  (typeof COL.STATUS === 'number' ? COL.STATUS : 90) + // fallback para cálculo
  (typeof COL.ENTRADA === 'number' ? COL.ENTRADA : 140) +
  COL.AULAS + COL.FREQUENCIA + COL.MEDIA + COL.PAGO + COL.PENDENTE + COL.ATRASADO + COL.ACOES;

const CELL_BASE = "px-2 py-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2 align-middle text-left text-xs whitespace-nowrap";
const STICKY_CELL = "sticky left-0 z-20 bg-card group-hover:bg-muted transition-colors";
const STICKY_SHADOW = { boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" };

// Helper function to get column styles
const getColumnStyle = (colWidth: string | number) => {
  if (colWidth === 'auto') {
    return { width: 'fit-content', minWidth: '60px', maxWidth: '120px' };
  }
  return { width: colWidth, minWidth: colWidth };
};

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
    <TableRow className="group hover:bg-muted/30 transition-colors">
      {/* Status */}
      <TableCell className="px-2 py-2 align-middle whitespace-nowrap" style={{ width: '1%' }}>
        <StatusBadge variant={student.status === "ativo" ? "success" : "default"}>
          {student.status === "ativo" ? "Ativo" : "Inativo"}
        </StatusBadge>
      </TableCell>

      {/* Aluno — sticky */}
      <TableCell className={`${CELL_BASE} ${STICKY_CELL}`} style={{ ...STICKY_SHADOW, ...getColumnStyle(COL.ALUNO) }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-accent-foreground">
              {student.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" title={student.name}>
              {student.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {student.email || student.phone || "—"}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Entrada */}
      <TableCell className={CELL_BASE} style={getColumnStyle(COL.ENTRADA)}>
        <span className="text-xs text-muted-foreground">
          {formatSince(student.created_at)}
        </span>
      </TableCell>

      {/* Aulas */}
      <TableCell className={CELL_BASE} style={getColumnStyle(COL.AULAS)}>
        <span className="text-xs font-medium">
          {student.stats.totalClasses}
        </span>
      </TableCell>

      {/* Frequência */}
      <TableCell className={CELL_BASE} style={getColumnStyle(COL.FREQUENCIA)}>
        <div className="flex items-center gap-1">
          {student.stats.attendanceRate !== null ? (
            <>
              {lowAttendance ? (
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              )}
              <span
                className={`text-xs font-medium ${
                  lowAttendance
                    ? "text-rose-600"
                    : "text-success"
                }`}
              >
                {student.stats.attendanceRate.toFixed(0)}%
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              —
            </span>
          )}
        </div>
      </TableCell>

      {/* Média */}
      <TableCell className={CELL_BASE} style={getColumnStyle(COL.MEDIA)}>
        {student.stats.averageGrade !== null ? (
          <span
            className={`text-xs font-medium ${
              student.stats.averageGrade >= 7
                ? "text-success"
                : student.stats.averageGrade >= 5
                ? "text-amber-600"
                : "text-rose-600"
            }`}
          >
            {student.stats.averageGrade.toFixed(1)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            —
          </span>
        )}
      </TableCell>

      {/* Pago */}
      <TableCell className={CELL_BASE} style={getColumnStyle(COL.PAGO)}>
        <span className="text-xs text-success font-medium">
          {formatCurrency(student.stats.totalPaid)}
        </span>
      </TableCell>

      {/* Pendente */}
      <TableCell className={CELL_BASE} style={getColumnStyle(COL.PENDENTE)}>
        <span className="text-xs text-amber-600 font-medium">
          {formatCurrency(student.stats.totalPending)}
        </span>
      </TableCell>

      {/* Atrasado */}
      <TableCell className={CELL_BASE} style={getColumnStyle(COL.ATRASADO)}>
        <span
          className={`text-xs font-medium ${
            hasOverdue ? "text-rose-600" : "text-muted-foreground"
          }`}
        >
          {formatCurrency(student.stats.totalOverdue)}
        </span>
      </TableCell>

      {/* Ações */}
      <TableCell className={CELL_BASE} style={getColumnStyle(COL.ACOES)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewStudent(student.id)}
          title="Ver detalhes"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
