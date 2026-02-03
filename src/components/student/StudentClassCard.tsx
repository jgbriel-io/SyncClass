import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, CheckCircle2, XCircle, Star, ChevronRight, ChevronDown, ChevronUp, MessageSquare, DollarSign, Timer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { getClassStatusWithTime } from "@/lib/utils/classTime";

interface StudentClassCardProps {
  classLog: {
    id: string;
    class_date: string;
    start_at?: string | null;
    end_at?: string | null;
    duration_minutes?: number | null;
    attendance: boolean | null;
    grade?: number | null;
    title?: string | null;
    teacher_name?: string;
    feedback?: string | null;
    amount?: number | null;
  };
  onClick?: () => void;
}

function formatTimeRange(startAt: string | null | undefined, endAt: string | null | undefined): string {
  if (!startAt || !endAt) return "—";
  try {
    const start = format(new Date(startAt), "HH:mm", { locale: ptBR });
    const end = format(new Date(endAt), "HH:mm", { locale: ptBR });
    return `${start} às ${end}`;
  } catch {
    return "—";
  }
}

function formatDuration(minutes: number | null | undefined, startAt: string | null | undefined, endAt: string | null | undefined): string {
  if (minutes != null && minutes > 0) {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${minutes} min`;
  }
  if (startAt && endAt) {
    try {
      const start = new Date(startAt).getTime();
      const end = new Date(endAt).getTime();
      const diff = Math.round((end - start) / 60000);
      if (diff > 0) return formatDuration(diff, undefined, undefined);
    } catch {
      // ignore
    }
  }
  return "—";
}

export function StudentClassCard({ classLog, onClick }: StudentClassCardProps) {
  const [expanded, setExpanded] = useState(false);
  const formattedDate = formatDate(classLog.class_date);
  const timeRange = formatTimeRange(classLog.start_at, classLog.end_at);
  const status = getClassStatusWithTime({
    class_date: classLog.class_date,
    start_at: classLog.start_at ?? null,
    end_at: classLog.end_at ?? null,
    attendance: classLog.attendance,
  });
  const isConcluida = status.label === "Concluída";
  const hasDetails = !!classLog.feedback?.trim();

  const badgeLabel = isConcluida
    ? (classLog.attendance ? "Concluída" : "Falta")
    : status.label === "Avaliação pendente"
      ? "Pagamento pendente"
      : status.label;
  const badgeVariant = isConcluida
    ? (classLog.attendance ? "success" : "destructive")
    : status.variant;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  return (
    <Card
      className={cn(
        "p-4 transition-all hover:shadow-md",
        onClick && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1 min-w-0">
          {/* Cabeçalho: no mobile badge + título; no desktop título | badge */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <StatusBadge variant={badgeVariant} className="sm:order-2 w-fit">
              {badgeLabel}
            </StatusBadge>
            <h3 className="font-semibold text-sm text-foreground truncate sm:order-1">
              {classLog.title?.trim() || "Aula"}
            </h3>
          </div>

          {/* Data */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>

          {/* Horário */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span>{timeRange}</span>
          </div>

          {/* Professor */}
          {classLog.teacher_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span>{classLog.teacher_name}</span>
            </div>
          )}

          {/* Presença e nota (só quando concluída) */}
          {isConcluida && (
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t">
              {classLog.attendance ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Presente</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Faltou</span>
                </div>
              )}
              {classLog.grade != null ? (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Nota: {Number(classLog.grade).toFixed(1)}</span>
                </div>
              ) : classLog.attendance === false ? (
                <span className="text-sm font-medium text-destructive">Não compareceu</span>
              ) : null}
            </div>
          )}

          {/* Detalhes expandidos: mesmo fluxo vertical (sem caixa) */}
          {expanded && (
            <>
              {!classLog.teacher_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span>Professor: —</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>Valor da aula: {classLog.amount != null ? formatCurrency(classLog.amount) : "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>Nota: {classLog.grade != null ? Number(classLog.grade).toFixed(1) : "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>Duração: {formatDuration(classLog.duration_minutes, classLog.start_at, classLog.end_at)}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground">
                    {hasDetails ? (
                      <span className="whitespace-pre-wrap">{classLog.feedback}</span>
                    ) : (
                      <span className="italic">Nenhum feedback registrado para esta aula.</span>
                    )}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Botão Ver mais / Ver menos (sempre no final do card) */}
          <div className="pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
              onClick={handleToggleExpand}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Ver mais
                </>
              )}
            </Button>
          </div>
        </div>

        {onClick && (
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    </Card>
  );
}
