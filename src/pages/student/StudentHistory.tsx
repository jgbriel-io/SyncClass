import { useMemo } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentClassCard } from "@/components/student/StudentClassCard";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, TrendingUp, Award, Calendar as CalendarIcon, XCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useStudentClassLogs, useStudentStats, useLastClass } from "@/hooks/useStudentPortal";
import { formatDate } from "@/lib/utils/formatters";

function classLogToCardProps(record: {
  id: string;
  class_date: string;
  start_at?: string | null;
  end_at?: string | null;
  duration_minutes?: number | null;
  attendance: boolean | null;
  grade?: number | null;
  title?: string | null;
  teachers?: { name?: string } | null;
  feedback?: string | null;
  financial_records?: { amount?: number | null }[] | null;
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
    teacher_name: record.teachers?.name ?? undefined,
    feedback: record.feedback ?? null,
    amount: record.financial_records?.[0]?.amount ?? null,
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

  const chartData = useMemo(() => {
    const byWeek = new Map<string, number[]>();
    for (const log of classesWithGrade) {
      const d = new Date(log.class_date + "T12:00:00");
      const weekStart = startOfWeek(d, { weekStartsOn: 1, locale: ptBR });
      const key = weekStart.toISOString().slice(0, 10);
      if (!byWeek.has(key)) byWeek.set(key, []);
      byWeek.get(key)!.push(Number(log.grade));
    }
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, grades]) => ({
        week: formatDate(weekKey),
        media: grades.reduce((a, b) => a + b, 0) / grades.length,
      }));
  }, [classesWithGrade]);

  const renderClassCards = (records: typeof classLogs) =>
    records.length === 0 ? (
      <div className="rounded-lg border bg-card">
        <EmptyState icon={BookOpen} message="Nenhuma aula registrada ainda" />
      </div>
    ) : (
      <div className="space-y-3">
        {records.map((record) => (
          <StudentClassCard key={record.id} classLog={classLogToCardProps(record)} />
        ))}
      </div>
    );

  return (
    <PageContainer constrained maxWidth="5xl">
      {/* Header */}
      <div className="mb-4">
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
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Histórico de Aulas
              </h2>
              {renderClassCards(classLogs)}
            </div>
          </TabsContent>

          {/* Aba Presença: stats (taxa %, total faltas, última falta) + cards só faltas */}
          <TabsContent value="presenca" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Aulas faltadas
              </h2>
              {missedClasses.length === 0 ? (
                <div className="rounded-lg border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma falta registrada.</p>
                </div>
              ) : (
                renderClassCards(missedClasses)
              )}
            </div>
          </TabsContent>

          {/* Aba Médias: gráfico evolução + stats (média, melhor, pior, tendência) + cards só com nota */}
          <TabsContent value="media" className="mt-0">
            {chartData.length > 0 && (
              <div className="mb-6 rounded-lg border bg-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Evolução da média (por semana)</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(1), "Média"]}
                        labelFormatter={(label) => `Semana ${label}`}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StudentMetricCard
                icon={Award}
                label="Média geral"
                value={stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : "—"}
                variant="default"
              />
              <StudentMetricCard
                icon={ArrowUpRight}
                label="Melhor nota"
                value={classesWithGrade.length > 0 ? gradeStats.best.toFixed(1) : "—"}
                variant="success"
              />
              <StudentMetricCard
                icon={ArrowDownRight}
                label="Pior nota"
                value={classesWithGrade.length > 0 ? gradeStats.worst.toFixed(1) : "—"}
                variant="default"
              />
              <StudentMetricCard
                icon={gradeStats.trend === "up" ? ArrowUpRight : gradeStats.trend === "down" ? ArrowDownRight : Award}
                label="Tendência"
                value={gradeStats.trend === "up" ? "Subindo" : gradeStats.trend === "down" ? "Caindo" : "—"}
                variant={gradeStats.trend === "up" ? "success" : gradeStats.trend === "down" ? "destructive" : "default"}
              />
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Aulas com nota
              </h2>
              {classesWithGrade.length === 0 ? (
                <div className="rounded-lg border bg-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma aula com nota registrada.</p>
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
