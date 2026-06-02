import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  BookOpen,
  UserCheck,
  Percent,
  Award,
  Package,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ClassesFilters,
  type ClassesFiltersState,
  type ClassStatusFilter,
} from "@/components/filters/ClassesFilters";
import { defaultClassesFilters } from "@/components/filters/filterDefaults";
import { ClassLogFormDialog } from "@/components/classes/ClassLogFormDialog";
import { PackageClassesDialog } from "@/components/classes/PackageClassesDialog";
import { PostClassDialog } from "@/components/classes/PostClassDialog";
import { ClassDetailSheet } from "@/components/classes/ClassDetailSheet";
import { ClassDeleteDialog } from "@/components/classes/ClassDeleteDialog";
import { ClassesTableView } from "@/components/classes/ClassesTableView";
import { ClassesCardView } from "@/components/classes/ClassesCardView";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import {
  useClassLogs,
  useClassLogsSummary,
  useCreateClassLog,
  useCreateClassLogWithFinancial,
  useUpdateClassLog,
  ClassLogInsert,
  ClassLogWithStudent,
  ClassLogWithFinancialData,
} from "@/hooks/useClassLogs";
import { isClassEvaluationBlocked } from "@/lib/utils/classTime";
import { StatCard } from "@/components/ui/stat-card";
import { PeriodFilter as PeriodFilterWidget } from "@/components/ui/period-filter";
import { type PeriodFilter } from "@/lib/utils/periodFilter";
import { classes as classesContent } from "@/content";

interface ClassesViewProps {
  title?: string;
  subtitle?: string;
  viewMode?: "table" | "cards";
  showTeacherColumn?: boolean;
  enableTeacherSelection?: boolean;
  /** Quando definido (ex.: perfil professor), fixa o professor e oculta filtro/coluna */
  autoTeacherId?: string | null;
  /** Status inicial vindo da URL (ex.: notificações) */
  initialStatus?: ClassStatusFilter;
  /** Modo admin: oculta botões de criar/editar */
  isAdmin?: boolean;
}

export function ClassesView({
  title = "Aulas",
  subtitle = "Registro de aulas e acompanhamento",
  viewMode = "table",
  showTeacherColumn = true,
  enableTeacherSelection = true,
  autoTeacherId = null,
  initialStatus,
  isAdmin = false,
}: ClassesViewProps) {
  const [filters, setFilters] = useState<ClassesFiltersState>({
    ...defaultClassesFilters,
    ...(initialStatus && { status: initialStatus }),
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ClassLogWithStudent | null>(
    null
  );
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      setSelectedLog(null);
      setIsFormOpen(true);
      setSearchParams(
        (prev) => {
          prev.delete("action");
          return prev;
        },
        { replace: true }
      );
    } else if (action === "create-package") {
      setPackageDialogOpen(true);
      setSearchParams(
        (prev) => {
          prev.delete("action");
          return prev;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<ClassLogWithStudent | null>(
    null
  );
  const [postClassDialogOpen, setPostClassDialogOpen] = useState(false);
  const [logForPostClass, setLogForPostClass] =
    useState<ClassLogWithStudent | null>(null);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [packageDialogKey, setPackageDialogKey] = useState(0);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [logForDetailSheet, setLogForDetailSheet] =
    useState<ClassLogWithStudent | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<PeriodFilter>("month");

  const effectiveTeacherId =
    autoTeacherId ??
    (filters.teacherId !== "all" ? filters.teacherId : undefined);

  useEffect(() => {
    if (initialStatus)
      setFilters((prev) => ({ ...prev, status: initialStatus }));
  }, [initialStatus]);

  const {
    data: logs = [],
    isLoading,
    error,
    page,
    setPage,
    hasMore,
    totalCount,
    isFetching,
  } = useClassLogs(effectiveTeacherId ?? undefined, {
    pageSize: 10,
    filters: useMemo(
      () => ({
        teacherId: effectiveTeacherId ?? filters.teacherId,
        studentId: filters.studentId,
        period: filters.period,
        status: filters.status,
        sort: filters.sort,
      }),
      [
        effectiveTeacherId,
        filters.teacherId,
        filters.studentId,
        filters.period,
        filters.status,
        filters.sort,
      ]
    ),
  });

  const { data: teachers = [] } = useTeachers();
  const { data: students = [] } = useStudents();
  const activeStudents = students.filter((s) => s.status === "ativo");

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const { data: summary } = useClassLogsSummary(
    effectiveTeacherId ?? undefined,
    period
  );
  const createLog = useCreateClassLog();
  const createLogWithFinancial = useCreateClassLogWithFinancial();
  const updateLog = useUpdateClassLog();

  const filteredLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      const searchLower = filters.search.toLowerCase();
      const studentName = log.students?.name || "";
      const title = log.title || "";
      const matchesSearch =
        !searchLower ||
        studentName.toLowerCase().includes(searchLower) ||
        title.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
      if (filters.classType === "pacote" && !log.financial_record_via_package)
        return false;
      if (
        filters.classType === "individual" &&
        log.financial_record_via_package
      )
        return false;
      return true;
    });
    return filtered.sort((a, b) => {
      const createdA = new Date(a.created_at).getTime();
      const createdB = new Date(b.created_at).getTime();
      return filters.sort === "oldest"
        ? createdA - createdB
        : createdB - createdA;
    });
  }, [logs, filters]);

  const teacherMap = new Map<string, string>();
  teachers.forEach((t: Teacher) => {
    if (t.id && t.name) teacherMap.set(t.id, t.name);
  });

  const handleCreateOrUpdate = (
    data: ClassLogInsert,
    financialUpdate?: {
      financialRecordId: string;
      dueDate: string;
      amount?: number;
    }
  ) => {
    if (selectedLog) {
      updateLog.mutate(
        { id: selectedLog.id, ...data, ...financialUpdate },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setSelectedLog(null);
          },
        }
      );
    } else {
      createLog.mutate(data, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleCreateWithFinancial = (data: ClassLogWithFinancialData) => {
    createLogWithFinancial.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    });
  };

  const attendanceRate = summary
    ? summary.totalClasses > 0
      ? ((summary.totalPresent / summary.totalClasses) * 100).toFixed(0)
      : "0"
    : "0";

  const isMutating =
    createLog.isPending ||
    createLogWithFinancial.isPending ||
    updateLog.isPending;

  const sharedViewProps = {
    logs,
    filteredLogs,
    page,
    setPage,
    hasMore,
    totalCount,
    isFetching,
    listTopRef,
    onViewDetail: (log: ClassLogWithStudent) => {
      setLogForDetailSheet(log);
      setDetailSheetOpen(true);
    },
    onEdit: (log: ClassLogWithStudent) => {
      setSelectedLog(log);
      setIsFormOpen(true);
    },
    onDelete: (log: ClassLogWithStudent) => {
      setLogToDelete(log);
      setDeleteDialogOpen(true);
    },
    onEvaluate: (log: ClassLogWithStudent) => {
      setLogForPostClass(log);
      setPostClassDialogOpen(true);
    },
    onCreateNew: () => {
      setSelectedLog(null);
      setIsFormOpen(true);
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodFilterWidget value={period} onChange={setPeriod} />
          {!isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={() => setPackageDialogOpen(true)}
              >
                <Package className="h-4 w-4 mr-2" />
                {classesContent.view.packageButton}
              </Button>
              <Button
                onClick={() => {
                  setSelectedLog(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {classesContent.view.newButton}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 laptop:grid-cols-4">
        <StatCard
          title={classesContent.view.statTotal}
          value={summary?.totalClasses ?? 0}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title={classesContent.view.statAttended}
          value={summary?.totalPresent ?? 0}
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title={classesContent.view.statPending}
          value={`${attendanceRate}%`}
          icon={Percent}
          variant="default"
        />
        <StatCard
          title={classesContent.view.statEvaluationPending}
          value={
            summary?.averageGrade != null
              ? summary.averageGrade.toFixed(1)
              : "—"
          }
          icon={Award}
          variant="primaryHighlight"
        />
      </div>

      <ClassesFilters
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPage(0);
        }}
        onReset={() => {
          setFilters(defaultClassesFilters);
          setPage(0);
        }}
        teachers={teachers}
        students={activeStudents}
        showTeacherFilter={showTeacherColumn}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{classesContent.view.errorLoading}</p>
        </div>
      )}

      {!error && viewMode === "table" && (
        <ClassesTableView
          {...sharedViewProps}
          isLoading={isLoading}
          showTeacherColumn={showTeacherColumn}
          teacherMap={teacherMap}
          isAdmin={isAdmin}
        />
      )}

      {!isLoading && !error && viewMode === "cards" && (
        <ClassesCardView {...sharedViewProps} />
      )}

      <PostClassDialog
        open={postClassDialogOpen}
        onOpenChange={(open) => {
          setPostClassDialogOpen(open);
          if (!open) setLogForPostClass(null);
        }}
        classLog={logForPostClass}
        onSuccess={() => setLogForPostClass(null)}
      />

      <ClassDetailSheet
        classLog={logForDetailSheet}
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) setLogForDetailSheet(null);
        }}
        showTeacherColumn={showTeacherColumn}
        teacherName={
          logForDetailSheet
            ? (logForDetailSheet.teachers?.name ??
              (logForDetailSheet.teacher_id
                ? teacherMap.get(logForDetailSheet.teacher_id)
                : null) ??
              (logForDetailSheet.students?.teacher_id
                ? teacherMap.get(logForDetailSheet.students.teacher_id)
                : null) ??
              "Sem professor")
            : "—"
        }
      />

      <ClassLogFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedLog(null);
        }}
        classLog={selectedLog}
        onSubmit={handleCreateOrUpdate}
        onSubmitWithFinancial={handleCreateWithFinancial}
        isLoading={isMutating}
        teacherId={autoTeacherId ?? undefined}
        enableTeacherSelection={enableTeacherSelection}
      />

      <PackageClassesDialog
        key={packageDialogKey}
        open={packageDialogOpen}
        onOpenChange={(open) => {
          setPackageDialogOpen(open);
          if (!open) setPackageDialogKey((k) => k + 1);
        }}
        teacherId={effectiveTeacherId ?? undefined}
        enableTeacherSelection={enableTeacherSelection}
      />

      <ClassDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        classLog={logToDelete}
        onClose={() => {
          setDeleteDialogOpen(false);
          setLogToDelete(null);
        }}
      />
    </div>
  );
}
