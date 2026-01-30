import { StudentLayout } from "@/components/layout/StudentLayout";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentClassCard } from "@/components/student/StudentClassCard";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import { Loader2, BookOpen, TrendingUp, Award, Calendar as CalendarIcon } from "lucide-react";
import { useStudentClassLogs, useStudentStats } from "@/hooks/useStudentPortal";

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
            {/* ⚡ P0-1: Summary usando StudentMetricCard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StudentMetricCard
                icon={CalendarIcon}
                label="Aulas"
                value={stats.totalClasses}
                variant="default"
              />
              <StudentMetricCard
                icon={TrendingUp}
                label="Presença"
                value={`${attendancePercentage}%`}
                variant="success"
              />
              <StudentMetricCard
                icon={Award}
                label="Média"
                value={stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : "—"}
                variant="default"
              />
            </div>

            {/* ⚡ P0-1: Timeline usando StudentClassCard */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Histórico de Aulas
              </h2>
              {classLogs.length === 0 ? (
                <div className="rounded-lg border bg-card">
                  <EmptyState
                    icon={BookOpen}
                    message="Nenhuma aula registrada ainda"
                  />
                </div>
              ) : (
                classLogs.map((record) => (
                  <StudentClassCard
                    key={record.id}
                    classLog={{
                      id: record.id,
                      class_date: record.class_date,
                      attendance: record.attendance,
                      grade: record.grade,
                      title: record.title,
                      teacher_name: undefined, // Portal do aluno não precisa mostrar nome do professor (sempre o mesmo)
                    }}
                  />
                ))
              )}
            </div>
          </>
        )}
      </PageContainer>
    </StudentLayout>
  );
}
