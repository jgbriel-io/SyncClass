import { useMemo, useState, useEffect } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentClassCard } from "@/components/student/StudentClassCard";
import { StudentMetricCard } from "@/components/student/StudentMetricCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CircleNotch as Loader2,
  BookOpen,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Medal as Award,
  Calendar as CalendarIcon,
  XCircle,
} from "@phosphor-icons/react";
import {
  useStudentClassLogs,
  useStudentStats,
  useLastClass,
} from "@/hooks/useStudentPortal";
import { formatDate } from "@/lib/utils/formatters";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { getClassStatusWithTime } from "@/lib/utils/classTime";
import { studentPortal } from "@/content";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  payment_status?: string | null;
  payment_due_date?: string | null;
  is_package?: boolean;
  observations?: string | null;
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
    payment_status: record.payment_status ?? null,
    payment_due_date: record.payment_due_date ?? null,
    is_package: record.is_package,
    observations: record.observations ?? null,
  };
}

const PAGE_SIZE = 10;

export default function StudentHistory() {
  const { data: classLogs = [], isLoading, error } = useStudentClassLogs();
  const stats = useStudentStats();
  const lastClass = useLastClass();
  const [statusFilter, setStatusFilter] = useState<string>("aberto");
  const [sortOrder, setSortOrder] = useState<string>("recente");
  const [pageAulas, setPageAulas] = useState(1);
  const [pagePresenca, setPagePresenca] = useState(1);
  const [pageMedia, setPageMedia] = useState(1);

  useEffect(() => {
    setPageAulas(1);
  }, [statusFilter, sortOrder]);

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
    if (grades.length === 0)
      return { best: 0, worst: 0, trend: null as "up" | "down" | null };
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

  // Filtrar e ordenar aulas
  const filteredClassLogs = useMemo(() => {
    let filtered = classLogs;

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = classLogs.filter((log) => {
        const status = getClassStatusWithTime({
          class_date: log.class_date,
          start_at: log.start_at ?? null,
          end_at: log.end_at ?? null,
          attendance: log.attendance,
        });

        if (statusFilter === "aberto") {
          // Em aberto = Pendente (não avaliada) ou Agendada
          return status.label === "Pendente" || status.label === "Agendada";
        }
        if (statusFilter === "concluida") {
          return status.label === "Concluída";
        }

        return true;
      });
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(
        a.class_date +
          "T" +
          (a.start_at
            ? new Date(a.start_at).toTimeString().slice(0, 8)
            : "00:00:00")
      );
      const dateB = new Date(
        b.class_date +
          "T" +
          (b.start_at
            ? new Date(b.start_at).toTimeString().slice(0, 8)
            : "00:00:00")
      );

      if (sortOrder === "recente") {
        return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
      } else {
        return dateA.getTime() - dateB.getTime(); // Mais antiga primeiro
      }
    });

    return sorted;
  }, [classLogs, statusFilter, sortOrder]);

  const totalPagesAulas = Math.ceil(filteredClassLogs.length / PAGE_SIZE);
  const pagedAulas = filteredClassLogs.slice(
    (pageAulas - 1) * PAGE_SIZE,
    pageAulas * PAGE_SIZE
  );

  const totalPagesPresenca = Math.ceil(missedClasses.length / PAGE_SIZE);
  const pagedPresenca = missedClasses.slice(
    (pagePresenca - 1) * PAGE_SIZE,
    pagePresenca * PAGE_SIZE
  );

  const totalPagesMedia = Math.ceil(classesWithGrade.length / PAGE_SIZE);
  const pagedMedia = classesWithGrade.slice(
    (pageMedia - 1) * PAGE_SIZE,
    pageMedia * PAGE_SIZE
  );

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    setPage: (p: number) => void
  ) =>
    totalPages > 1 ? (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              aria-disabled={currentPage === 1}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
          <PaginationItem>
            <span className="px-3 py-2 text-sm">
              {currentPage} / {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    ) : null;

  const renderClassCards = (records: typeof classLogs) =>
    records.length === 0 ? (
      <div className="rounded-xl border bg-card">
        <EmptyState icon={BookOpen} message={studentPortal.history.noHistory} />
      </div>
    ) : (
      <div className={stack("DEFAULT")}>
        {records.map((record) => (
          <StudentClassCard
            key={record.id}
            classLog={classLogToCardProps(record)}
          />
        ))}
      </div>
    );

  const renderStatusFilter = () => (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="flex items-center gap-3">
        <Label
          htmlFor="status-filter"
          className="text-sm font-medium whitespace-nowrap"
        >
          {studentPortal.history.statusFilterLabel}
        </Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aberto">
              {studentPortal.history.statusOpen}
            </SelectItem>
            <SelectItem value="concluida">
              {studentPortal.history.statusCompleted}
            </SelectItem>
            <SelectItem value="all">
              {studentPortal.history.statusAll}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Label
          htmlFor="sort-order"
          className="text-sm font-medium whitespace-nowrap"
        >
          {studentPortal.history.sortLabel}
        </Label>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger id="sort-order" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recente">
              {studentPortal.history.sortRecent}
            </SelectItem>
            <SelectItem value="antiga">
              {studentPortal.history.sortOldest}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <PageContainer constrained maxWidth="5xl">
      {/* Header */}
      <div className="mb-4">
        <h1 className={typography("H1")}>{studentPortal.history.title}</h1>
        <p className={`${typography("SMALL")} mt-1`}>
          {studentPortal.history.subtitle}
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
          <p className={typography("ERROR")}>
            {studentPortal.history.loadError}
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <Tabs defaultValue="aulas" className="w-full">
          <TabsList className="w-full sm:w-auto mb-4">
            <TabsTrigger value="aulas" className="flex-1 sm:flex-none">
              {studentPortal.history.tabClasses}
            </TabsTrigger>
            <TabsTrigger value="presenca" className="flex-1 sm:flex-none">
              {studentPortal.history.tabAttendance}
            </TabsTrigger>
            <TabsTrigger value="media" className="flex-1 sm:flex-none">
              {studentPortal.history.tabGrades}
            </TabsTrigger>
          </TabsList>

          {/* Aba Aulas: resumo (total + última aula) + cards completos */}
          <TabsContent value="aulas" className="mt-0">
            <div className="mb-6">
              <StudentMetricCard
                icon={CalendarIcon}
                label={studentPortal.history.totalClassesLabel}
                value={stats.totalClasses}
                description={
                  lastClass
                    ? studentPortal.history.lastClassLabel(
                        formatDate(lastClass.class_date)
                      )
                    : undefined
                }
                variant="default"
              />
            </div>
            {renderStatusFilter()}
            <div className={stack("DEFAULT")}>
              <h2 className={typography("TABLE_HEADER")}>
                {studentPortal.history.sectionTitle}
              </h2>
              {renderClassCards(pagedAulas)}
              {renderPagination(pageAulas, totalPagesAulas, setPageAulas)}
            </div>
          </TabsContent>

          {/* Aba Presença: stats (taxa %, total faltas, última falta) + cards só faltas */}
          <TabsContent value="presenca" className="mt-0">
            <div
              className={`grid grid-cols-1 sm:grid-cols-3 ${gap("DEFAULT")} mb-6`}
            >
              <StudentMetricCard
                icon={TrendingUp}
                label={studentPortal.history.attendanceRateLabel}
                value={`${attendancePercentage}%`}
                variant="success"
              />
              <StudentMetricCard
                icon={XCircle}
                label={studentPortal.history.totalAbsencesLabel}
                value={totalFaltas}
                variant={totalFaltas > 0 ? "destructive" : "default"}
              />
              <StudentMetricCard
                icon={CalendarIcon}
                label={studentPortal.history.lastAbsenceLabel}
                value={lastAbsence ? formatDate(lastAbsence.class_date) : "—"}
                variant="default"
              />
            </div>
            <div className={stack("DEFAULT")}>
              <h2 className={typography("TABLE_HEADER")}>
                {studentPortal.history.missedClassesTitle}
              </h2>
              {missedClasses.length === 0 ? (
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className={typography("SMALL")}>
                    {studentPortal.history.noAbsences}
                  </p>
                </div>
              ) : (
                <>
                  {renderClassCards(pagedPresenca)}
                  {renderPagination(
                    pagePresenca,
                    totalPagesPresenca,
                    setPagePresenca
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Aba Médias: cards (média, melhor, pior) + lista de aulas com nota */}
          <TabsContent value="media" className="mt-0">
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${gap("DEFAULT")} mb-6`}
            >
              <StudentMetricCard
                icon={Award}
                label={studentPortal.history.averageGradeLabel}
                value={
                  stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : "—"
                }
                variant="default"
              />
              <StudentMetricCard
                icon={TrendingUp}
                label={studentPortal.history.bestGradeLabel}
                value={
                  classesWithGrade.length > 0 ? gradeStats.best.toFixed(1) : "—"
                }
                variant="success"
              />
              <StudentMetricCard
                icon={TrendingDown}
                label={studentPortal.history.worstGradeLabel}
                value={
                  classesWithGrade.length > 0
                    ? gradeStats.worst.toFixed(1)
                    : "—"
                }
                variant="destructive"
              />
            </div>
            <div className={stack("DEFAULT")}>
              <h2 className={typography("TABLE_HEADER")}>
                {studentPortal.history.gradesSectionTitle}
              </h2>
              {classesWithGrade.length === 0 ? (
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className={typography("SMALL")}>
                    {studentPortal.history.noGrades}
                  </p>
                </div>
              ) : (
                <>
                  {renderClassCards(pagedMedia)}
                  {renderPagination(pageMedia, totalPagesMedia, setPageMedia)}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}
