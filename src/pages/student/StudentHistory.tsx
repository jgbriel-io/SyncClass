import { StudentLayout } from "@/components/layout/StudentLayout";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar, Check, X, Loader2, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useStudentClassLogs, useStudentStats } from "@/hooks/useStudentPortal";

function formatDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

export default function StudentHistory() {
  const { data: classLogs = [], isLoading, error } = useStudentClassLogs();
  const stats = useStudentStats();

  const attendancePercentage = stats.attendanceRate.toFixed(0);

  return (
    <StudentLayout>
      <PageContainer constrained maxWidth="5xl">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Histórico Acadêmico</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suas aulas e progresso
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <EmptyState size="lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </EmptyState>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive text-sm">
              Erro ao carregar histórico. Tente novamente.
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-card p-3 text-center shadow-card">
                <p className="text-xl font-bold">{stats.totalClasses}</p>
                <p className="text-xs text-muted-foreground">Aulas</p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center shadow-card">
                <p className="text-xl font-bold text-success">{attendancePercentage}%</p>
                <p className="text-xs text-muted-foreground">Presença</p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center shadow-card">
                <p className="text-xl font-bold text-primary">
                  {stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Média</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {classLogs.length === 0 ? (
                <div className="rounded-lg border bg-card">
                  <EmptyState
                    icon={BookOpen}
                    message="Nenhuma aula registrada ainda"
                  />
                </div>
              ) : (
                classLogs.map((record, index) => (
                  <div
                    key={record.id}
                    className="rounded-lg border bg-card p-4 shadow-card animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            record.attendance ? "bg-success-muted" : "bg-destructive-muted"
                          }`}
                        >
                          {record.attendance ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <X className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(record.class_date)}
                            </span>
                            <StatusBadge
                              variant={record.attendance ? "success" : "destructive"}
                            >
                              {record.attendance ? "Presente" : "Ausente"}
                            </StatusBadge>
                          </div>
                          {record.feedback && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {record.feedback}
                            </p>
                          )}
                        </div>
                      </div>
                      {record.grade !== null && (
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-xl font-bold ${
                              Number(record.grade) >= 7
                                ? "text-success"
                                : Number(record.grade) >= 5
                                ? "text-warning"
                                : "text-destructive"
                            }`}
                          >
                            {Number(record.grade).toFixed(1)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </PageContainer>
    </StudentLayout>
  );
}
