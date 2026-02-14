import { useMemo } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentClassCard } from "@/components/student/StudentClassCard";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, TrendingUp, TrendingDown, Award, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { useStudentClassLogs, useStudentStats, useLastClass } from "@/hooks/useStudentPortal";
import { formatDate } from "@/lib/utils/formatters";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";

function classLogToCardProps(record: {
  id: string;
  class_date: string;
  start_at?: string | null;
  end_at?: string | null;
  duration_minutes?: number | null;
  attendance: boolean | null;
  grade?: number | null;
  title?: string | null;
  billed_amount?: number | null;
  teacher_name?: string;
  feedback?: string | null;
}) {
  return {
    id: record.id,
    class_date: record.class_date,
    start_at: record.start_at ?? null,
    end_at: record.end_at ?? null,
    duration_minutes: record.duration_minutes ?? null,
    attendance: record.attendance,
    grade: record.grade,
    title: record.title ?? null,
    teacher_name: record.teacher_name,
    feedback: record.feedback ?? null,
    amount: record.billed_amount ?? null,
  };
}

export default function StudentHistory() {
  const { data: classLogs = [], isLoading, error } = useStudentClassLogs();
  const stats = useStudentStats();
  const lastClass = useLastClass();

  const attendancePercentage = stats.attendanceRate.toFixed(0);

  const missedClasses = useMemo(
    () => classLogs.filter((log) => log.attendance === false),
    [classLogs]
  );
  const classesWithGrade = useMemo(
    () => classLogs.filter((log) => log.grade != null),
    [classLogs]
  );

  const lastAbsence = missedClasses[0] ?? null;
  const totalFaltas = missedClasses.length;

  const gradeStats = useMemo(() => {
    const grades = classesWithGrade.map((l) => Number(l.grade));
    if (grades.length === 0) return { best: 0, worst: 0, trend: null as "up" | "down" | null };
    const best = Math.max(...grades);
    const worst = Math.min(...grades);
    const n = 3;
    const recent = grades.slice(0, n);
    const previous = grades.slice(n, n * 2);
    let trend: "up" | "down" | null = null;
    if (recent.length === n && previous.length === n) {
      const avgRecent = recent.reduce((a, b) => a + b, 0) / n;
      const avgPrevious = previous.reduce((a, b) => a + b, 0) / n;
      trend = avgRecent >= avgPrevious ? "up" : "down";
    }
    return { best, worst, trend };
  }, [classesWithGrade]);

  const renderClassCards = (records: typeof classLogs) =>
    records.length === 0 ? (
      <div className="rounded-lg border bg-card">
        <EmptyState icon={BookOpen} message="Nenhuma aula registrada ainda" />
      </div>
    ) : (
      <div className={stack('DEFAULT')}>
        {records.map((record) => (
          <StudentClassCard key={record.id} classLog={classLogToCardProps(record)} />
        ))}
      </div>
    );

  return (
    <PageContainer constrained maxWidth="5xl">
      {/* Header */}
      <div className="mb-4">
        <h1 className={typography('H1')}>Histórico Acadêmico</h1>
        <p className={`${typography('SMALL')} mt-1`}>
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
          <p className={typography('ERROR')}>
            Erro ao carregar histórico. Tente novamente.
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <Tabs defaultValue="aulas" className="w-full">
          <TabsList className="w-full sm:w-auto mb-4">
            <TabsTrigger value="aulas" className="flex-1 sm:flex-none">Aulas</TabsTrigger>
            <TabsTrigger value="presenca" className="flex-1 sm:flex-none">Presença</TabsTrigger>
            <TabsTrigger value="media" className="flex-1 sm:flex-none">Média</TabsTrigger>
          </TabsList>

          {/* Aba Aulas: resumo (total + última aula) + cards completos */}
          <TabsContent value="aulas" className="mt-0">
            <div className="mb-6">
              <StudentMetricCard
                icon={CalendarIcon}
                label="Total de aulas"
                value={stats.totalClasses}
                description={lastClass ? `Última aula: ${formatDate(lastClass.class_date)}` : undefined}
                variant="default"
              />
            </div>
            <div className={stack('DEFAULT')}>
              <h2 className={typography('TABLE_HEADER')}>
                Histórico de Aulas
              </h2>
              {renderClassCards(classLogs)}
            </div>
          </TabsContent>

          {/* Aba Presença: stats (taxa %, total faltas, última falta) + cards só faltas */}
          <TabsContent value="presenca" className="mt-0">
            <div className={`grid grid-cols-1 sm:grid-cols-3 ${gap('DEFAULT')} mb-6`}>
              <StudentMetricCard
                icon={TrendingUp}
                label="Taxa de presença"
                value={`${attendancePercentage}%`}
                variant="success"
              />
              <StudentMetricCard
                icon={XCircle}
                label="Total de faltas"
                value={totalFaltas}
                variant={totalFaltas > 0 ? "destructive" : "default"}
              />
              <StudentMetricCard
                icon={CalendarIcon}
                label="Última falta"
                value={lastAbsence ? formatDate(lastAbsence.class_date) : "—"}
                variant="default"
              />
            </div>
            <div className={stack('DEFAULT')}>
              <h2 className={typography('TABLE_HEADER')}>
                Aulas faltadas
              </h2>
              {missedClasses.length === 0 ? (
                <div className="rounded-lg border bg-card p-6 text-center">
                  <p className={typography('SMALL')}>Nenhuma falta registrada.</p>
                </div>
              ) : (
                renderClassCards(missedClasses)
              )}
            </div>
          </TabsContent>

          {/* Aba Médias: cards (média, melhor, pior) + lista de aulas com nota */}
          <TabsContent value="media" className="mt-0">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${gap('DEFAULT')} mb-6`}>
              <StudentMetricCard
                icon={Award}
                label="Média geral"
                value={stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : "—"}
                variant="default"
              />
              <StudentMetricCard
                icon={TrendingUp}
                label="Melhor nota"
                value={classesWithGrade.length > 0 ? gradeStats.best.toFixed(1) : "—"}
                variant="success"
              />
              <StudentMetricCard
                icon={TrendingDown}
                label="Pior nota"
                value={classesWithGrade.length > 0 ? gradeStats.worst.toFixed(1) : "—"}
                variant="destructive"
              />
            </div>
            <div className={stack('DEFAULT')}>
              <h2 className={typography('TABLE_HEADER')}>
                Aulas com nota
              </h2>
              {classesWithGrade.length === 0 ? (
                <div className="rounded-lg border bg-card p-6 text-center">
                  <p className={typography('SMALL')}>Nenhuma aula com nota registrada.</p>
                </div>
              ) : (
                renderClassCards(classesWithGrade)
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}
