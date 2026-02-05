import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyClassesState } from "@/components/ui/contextual-empty-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Calendar, MoreHorizontal, Pencil, Trash2, Loader2, Receipt, BookOpen, Check, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  ClassesFilters,
  type ClassesFiltersState,
  type ClassStatusFilter,
} from "@/components/filters/ClassesFilters";
import { defaultClassesFilters } from "@/components/filters/filterDefaults";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogFormDialog } from "@/components/classes/ClassLogFormDialog";
import { PostClassDialog } from "@/components/classes/PostClassDialog";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  useClassLogs,
  useClassLogsSummary,
  useCreateClassLog,
  useCreateClassLogWithFinancial,
  useUpdateClassLog,
  useDeleteClassLog,
  ClassLogInsert,
  ClassLogWithStudent,
  ClassLogWithFinancialData,
} from "@/hooks/useClassLogs";
import { isClassEvaluationBlocked, getClassStatusWithTime } from "@/lib/utils/classTime";

function formatClassDateAndTime(log: {
  class_date: string;
  start_at?: string | null;
  end_at?: string | null;
}): { date: string; timeRange: string | null } {
  const date = format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
  if (log.start_at && log.end_at) {
    const start = format(new Date(log.start_at), "HH:mm", { locale: ptBR });
    const end = format(new Date(log.end_at), "HH:mm", { locale: ptBR });
    return { date, timeRange: `${start} às ${end}` };
  }
  return { date, timeRange: null };
}

function getPaymentStatusVariant(status: string | null): "success" | "warning" | "destructive" {
  switch (status) {
    case "pago":
      return "success";
    case "pendente":
      return "warning";
    case "atrasado":
      return "destructive";
    default:
      return "warning";
  }
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getPaymentStatusLabel(status: string | null): string {
  switch (status) {
    case "pago":
      return "Pago";
    case "pendente":
      return "Pendente";
    case "atrasado":
      return "Atrasado";
    default:
      return "Pendente";
  }
}

/** Badge de status: Concluída, Agendada, Em andamento, Avaliação pendente (usa horário quando disponível) */
function getClassStatusBadge(log: {
  class_date: string;
  attendance: boolean | null;
  start_at?: string | null;
  end_at?: string | null;
}) {
  return getClassStatusWithTime(log);
}

interface ClassesViewProps {
  title?: string;
  subtitle?: string;
  viewMode?: "table" | "cards";
  showTeacherColumn?: boolean;
  enableTeacherSelection?: boolean;
  /** Status inicial vindo da URL (ex.: notificações) */
  initialStatus?: ClassStatusFilter;
}

export function ClassesView({
  title = "Aulas",
  subtitle = "Registro de aulas e acompanhamento",
  viewMode = "table",
  showTeacherColumn = true,
  enableTeacherSelection = true,
  initialStatus,
}: ClassesViewProps) {
  const [filters, setFilters] = useState<ClassesFiltersState>({
    ...defaultClassesFilters,
    ...(initialStatus && { status: initialStatus }),
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ClassLogWithStudent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<ClassLogWithStudent | null>(null);
  const [postClassDialogOpen, setPostClassDialogOpen] = useState(false);
  const [logForPostClass, setLogForPostClass] = useState<ClassLogWithStudent | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialStatus) setFilters((prev) => ({ ...prev, status: initialStatus }));
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
  } = useClassLogs(undefined, {
    pageSize: 20,
    filters: { teacherId: filters.teacherId, period: filters.period },
  });
  const { data: teachers = [] } = useTeachers();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const { data: summary } = useClassLogsSummary();
  const createLog = useCreateClassLog();
  const createLogWithFinancial = useCreateClassLogWithFinancial();
  const updateLog = useUpdateClassLog();
  const deleteLog = useDeleteClassLog();

  const logsPendingRegistration = logs.filter(
    (log) => !isClassEvaluationBlocked(log) && log.attendance == null
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = filters.search.toLowerCase();
      const studentName = log.students?.name || "";
      const title = log.title || "";
      const matchesSearch =
        !searchLower ||
        studentName.toLowerCase().includes(searchLower) ||
        title.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      if (filters.teacherId !== "all" && log.teacher_id !== filters.teacherId) return false;

      const badge = getClassStatusBadge(log);
      const status =
        badge.label === "Concluída"
          ? "concluida"
          : badge.label === "Agendada" || badge.label === "Em andamento"
            ? "agendada"
            : "avaliacao_pendente";

      if (filters.status !== "all" && filters.status !== status) return false;

      if (filters.period !== "all") {
        const classDate = new Date(log.class_date + "T12:00:00");
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let from: Date;
        let to: Date;
        if (filters.period === "week") {
          from = new Date(today);
          from.setDate(from.getDate() - from.getDay());
          to = new Date(from);
          to.setDate(to.getDate() + 6);
        } else if (filters.period === "month") {
          from = new Date(today.getFullYear(), today.getMonth(), 1);
          to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else {
          from = new Date(today);
          from.setMonth(from.getMonth() - 3);
          to = new Date(today);
        }
        to.setHours(23, 59, 59, 999);
        if (classDate < from || classDate > to) return false;
      }
      return true;
    });
  }, [logs, filters]);

  // Mapa de professores para fallback (caso o join não traga o nome)
  const teacherMap = new Map<string, string>();
  teachers.forEach((t: Teacher) => {
    if (t.id && t.name) {
      teacherMap.set(t.id, t.name);
    }
  });

  const handleCreateOrUpdate = (
    data: ClassLogInsert,
    financialUpdate?: { financialRecordId: string; dueDate: string; amount?: number }
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
      createLog.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleCreateWithFinancial = (data: ClassLogWithFinancialData) => {
    createLogWithFinancial.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleEdit = (log: ClassLogWithStudent) => {
    setSelectedLog(log);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (log: ClassLogWithStudent) => {
    setLogToDelete(log);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (logToDelete) {
      deleteLog.mutate(logToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setLogToDelete(null);
        },
      });
    }
  };

  const attendanceRate = summary
    ? summary.totalClasses > 0
      ? ((summary.totalPresent / summary.totalClasses) * 100).toFixed(0)
      : "0"
    : "0";

  const isMutating = createLog.isPending || createLogWithFinancial.isPending || updateLog.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setSelectedLog(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Aula
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Total de Aulas</p>
          <p className="text-2xl font-semibold mt-1">
            {summary?.totalClasses || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Presenças</p>
          <p className="text-2xl font-semibold mt-1 text-success">
            {summary?.totalPresent || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Taxa de Presença</p>
          <p className="text-2xl font-semibold mt-1">
            {attendanceRate}%
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">Média Geral</p>
          <p className="text-2xl font-semibold mt-1 text-primary">
            {summary?.averageGrade?.toFixed(1) || "—"}
          </p>
        </div>
      </div>

      {/* Conferência: alerta de aulas passadas sem presença marcada */}
      {logsPendingRegistration.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-warning" />
            <p className="text-sm font-medium">
              <span className="font-semibold">{logsPendingRegistration.length}</span>{" "}
              {logsPendingRegistration.length === 1
                ? "aula pendentes de feedback"
                : "aulas pendentes de feedback "}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const first = logsPendingRegistration[0];
              if (first) handleEdit(first);
            }}
          >
            Ver e registrar
          </Button>
        </div>
      )}

      {/* Filtros avançados */}
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
        showTeacherFilter={showTeacherColumn}
      />

        {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            Erro ao carregar registros de aula. Tente novamente.
          </p>
        </div>
      )}

        {/* Table View (Admin) */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={8} />
        ) : !error && viewMode === "table" && (
          <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Aluno
                  </th>
                  {showTeacherColumn && (
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                      Aula / Professor
                    </th>
                  )}
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Data
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden sm:table-cell whitespace-nowrap">
                    Duração
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Nota
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell whitespace-nowrap">
                    Financeiro
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell whitespace-nowrap">
                    Valor
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                    Feedback
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const lastUpdatedAt = log.updated_at;
                  // Prioriza o nome do professor do join direto do class_log, depois fallback via teacher_id
                  const teacherName = 
                    log.teachers?.name ?? 
                    (log.teacher_id ? teacherMap.get(log.teacher_id) : null) ?? 
                    (log.students?.teacher_id ? teacherMap.get(log.students.teacher_id) : null) ?? 
                    "Sem professor";

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-accent-foreground">
                              {log.students?.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <p className="text-sm font-medium">
                                {log.students?.name || "Aluno não encontrado"}
                              </p>
                              <StatusBadge variant={getClassStatusBadge(log).variant}>
                                {getClassStatusBadge(log).label}
                              </StatusBadge>
                            </div>
                            {lastUpdatedAt && (
                              <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      {showTeacherColumn && (
                        <td className="px-6 py-4 align-top hidden lg:table-cell">
                          <div className="space-y-1 min-w-[200px]">
                            {log.title && (
                              <p className="text-sm font-semibold text-foreground whitespace-normal">
                                {log.title}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {teacherName}
                            </p>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 align-top whitespace-nowrap">
                        {(() => {
                          const { date, timeRange } = formatClassDateAndTime(log);
                          return (
                            <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                              <span>{date}</span>
                              {timeRange && <span className="text-xs">{timeRange}</span>}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 align-top hidden sm:table-cell whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(log.duration_minutes)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            log.attendance === false ? "text-destructive" : ""
                          }`}
                        >
                          {log.grade != null
                            ? Number(log.grade).toFixed(1)
                            : log.attendance === false
                              ? "Não compareceu"
                              : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top hidden xl:table-cell whitespace-nowrap">
                        {log.financial_records ? (
                          <StatusBadge
                            variant={getPaymentStatusVariant(log.financial_records.status)}
                          >
                            <Receipt className="h-3 w-3" />
                            {getPaymentStatusLabel(log.financial_records.status)}
                          </StatusBadge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem cobrança</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top hidden lg:table-cell whitespace-nowrap">
                        <span className={log.financial_records ? "text-sm font-medium tabular-nums" : "text-sm font-medium text-foreground"}>
                          {log.financial_records
                            ? formatCurrency(log.financial_records.amount)
                            : "Sem cobrança"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                          {log.feedback || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(log)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openDeleteDialog(log)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            size="sm"
                            className={`h-8 border-none ${
                              isClassEvaluationBlocked(log) && log.attendance == null
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : log.attendance != null
                                  ? "bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                                  : "bg-[#25D366] text-white hover:bg-[#1ebe57]"
                            }`}
                            disabled={isClassEvaluationBlocked(log) && log.attendance == null}
                            onClick={() => {
                              if (isClassEvaluationBlocked(log)) return;
                              setLogForPostClass(log);
                              setPostClassDialogOpen(true);
                            }}
                          >
                            {isClassEvaluationBlocked(log) && log.attendance == null ? (
                              <>
                                <Lock className="h-3.5 w-3.5 mr-1.5" />
                                Avaliar
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1.5" />
                                {log.attendance != null ? "Atualizar" : "Avaliar"}
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredLogs.length === 0 && (
            <div className="border-t">
              {logs.length === 0 ? (
                <EmptyClassesState
                  onAction={() => {
                    setSelectedLog(null);
                    setIsFormOpen(true);
                  }}
                  actionLabel="Registrar primeira aula"
                />
              ) : (
                <EmptyState
                  icon={Search}
                  title="Nenhum resultado"
                  message="Ajuste os filtros acima ou limpe a busca"
                />
              )}
            </div>
          )}
          {/* Paginação */}
          {(totalCount > 0 || page > 0) && (
            <div className="border-t px-6 py-3 flex items-center justify-between gap-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {totalCount > 0
                  ? `${page * 20 + 1}-${Math.min((page + 1) * 20, totalCount)} de ${totalCount}`
                  : "0 registros"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Cards View (Teacher) */}
      {!isLoading && !error && viewMode === "cards" && (
        <div className="space-y-4" ref={listTopRef}>
          {filteredLogs.map((log, index) => (
            <div
              key={log.id}
              className="relative rounded-lg border bg-card p-6 shadow-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-medium text-accent-foreground">
                      {log.students?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{log.students?.name || "Aluno não encontrado"}</h3>
                      <StatusBadge variant={getClassStatusBadge(log).variant}>
                        {getClassStatusBadge(log).label}
                      </StatusBadge>
                      {log.financial_records && (
                        <StatusBadge
                          variant={getPaymentStatusVariant(log.financial_records.status)}
                          className="flex items-center gap-1"
                        >
                          <Receipt className="h-3 w-3" />
                          {getPaymentStatusLabel(log.financial_records.status)}
                        </StatusBadge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {(() => {
                        const { date, timeRange } = formatClassDateAndTime(log);
                        return (
                          <span className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {date}
                            </span>
                            {timeRange && <span className="text-xs pl-6">{timeRange}</span>}
                          </span>
                        );
                      })()}
                      {log.duration_minutes != null && (
                        <span className="flex items-center gap-1.5">
                          {formatDuration(log.duration_minutes)}
                        </span>
                      )}
                      {log.financial_records ? (
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Receipt className="h-3.5 w-3.5" />
                          {formatCurrency(log.financial_records.amount)}
                        </span>
                      ) : (
                        <span className="text-foreground">Sem cobrança</span>
                      )}
                    </div>
                    {log.feedback && (
                      <p className="text-sm text-muted-foreground max-w-xl">
                        {log.feedback}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  {log.attendance != null && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Nota
                      </p>
                      {log.grade != null ? (
                        <p
                          className={`text-3xl font-bold ${
                            Number(log.grade) >= 7
                              ? "text-success"
                              : Number(log.grade) >= 5
                              ? "text-warning"
                              : "text-destructive"
                          }`}
                        >
                          {Number(log.grade).toFixed(1)}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-destructive">
                          Não compareceu
                        </p>
                      )}
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(log)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => openDeleteDialog(log)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    className={`h-8 border-none ${
                      isClassEvaluationBlocked(log) && log.attendance == null
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : log.attendance != null
                          ? "bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                          : "bg-[#25D366] text-white hover:bg-[#1ebe57]"
                    }`}
                    disabled={isClassEvaluationBlocked(log) && log.attendance == null}
                    onClick={() => {
                      if (isClassEvaluationBlocked(log)) return;
                      setLogForPostClass(log);
                      setPostClassDialogOpen(true);
                    }}
                  >
                    {isClassEvaluationBlocked(log) && log.attendance == null ? (
                      <>
                        <Lock className="h-3.5 w-3.5 mr-1.5" />
                        Avaliar
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        {log.attendance != null ? "Atualizar" : "Avaliar"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="rounded-lg border bg-card">
              {logs.length === 0 ? (
                <EmptyClassesState
                  onAction={() => {
                    setSelectedLog(null);
                    setIsFormOpen(true);
                  }}
                  actionLabel="Registrar primeira aula"
                />
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="Nenhum resultado"
                  message="Ajuste os filtros acima ou limpe a busca"
                />
              )}
            </div>
          )}
          {(totalCount > 0 || page > 0) && (
            <div className="rounded-lg border bg-card px-6 py-3 flex items-center justify-between gap-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {totalCount > 0 ? `${page * 20 + 1}-${Math.min((page + 1) * 20, totalCount)} de ${totalCount}` : "0 registros"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post-class Dialog */}
      <PostClassDialog
        open={postClassDialogOpen}
        onOpenChange={(open) => {
          setPostClassDialogOpen(open);
          if (!open) setLogForPostClass(null);
        }}
        classLog={logForPostClass}
        onSuccess={() => {
          setLogForPostClass(null);
        }}
      />

      {/* Form Dialog (pré-aula) */}
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
        enableTeacherSelection={enableTeacherSelection}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Tem certeza que deseja excluir o registro de aula de{" "}
                  <strong>{logToDelete?.students?.name}</strong> do dia{" "}
                  <strong>{logToDelete ? formatDate(logToDelete.class_date) : ""}</strong>?
                </p>
                {logToDelete?.financial_records?.status === "pago" ? (
                  <p className="text-destructive font-medium">
                    Esta aula possui uma cobrança já paga. A exclusão da aula também exclui a cobrança.
                    Deseja excluir mesmo assim?
                  </p>
                ) : logToDelete?.financial_records ? (
                  <span className="block text-warning">
                    ⚠️ Esta aula possui uma cobrança vinculada que também será afetada.
                  </span>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLog.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLog.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLog.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
