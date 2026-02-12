import { StatusBadge } from "@/components/ui/status-badge";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
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
import { Search, Plus, Calendar, MoreHorizontal, Pencil, Trash2, Loader2, Receipt, BookOpen, ChevronLeft, ChevronRight, UserCheck, Percent, Award, Package, Eye } from "lucide-react";
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
import { PackageClassesDialog } from "@/components/classes/PackageClassesDialog";
import { PostClassDialog } from "@/components/classes/PostClassDialog";
import { ClassDetailSheet } from "@/components/classes/ClassDetailSheet";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
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
import {
  tableThLarge,
  tableThMedium,
  tableThSmall,
  tableThSmallRight,
  tableTdLarge,
  tableTdMedium,
  tableTdSmall,
  tableTdActions,
} from "@/lib/utils/tableColumns";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";

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

/** Título para exibição: usa o salvo ou fallback "Aula - dd/mm/yyyy" */
function getClassLogDisplayTitle(log: { title?: string | null; class_date?: string }): string {
  if (log.title?.trim()) return log.title;
  const d = log.class_date ? format(new Date(log.class_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "";
  return d ? `Aula - ${d}` : "Aula";
}

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
}

export function ClassesView({
  title = "Aulas",
  subtitle = "Registro de aulas e acompanhamento",
  viewMode = "table",
  showTeacherColumn = true,
  enableTeacherSelection = true,
  autoTeacherId = null,
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
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [packageDialogKey, setPackageDialogKey] = useState(0);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [logForDetailSheet, setLogForDetailSheet] = useState<ClassLogWithStudent | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  const effectiveTeacherId = autoTeacherId ?? (filters.teacherId !== "all" ? filters.teacherId : undefined);

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
  } = useClassLogs(effectiveTeacherId ?? undefined, {
    pageSize: 10,
    filters: useMemo(
      () => ({
        teacherId: effectiveTeacherId ?? filters.teacherId,
        studentId: filters.studentId,
        period: filters.period,
        status: filters.status,
      }),
      [effectiveTeacherId, filters.teacherId, filters.studentId, filters.period, filters.status]
    ),
  });
  const { data: teachers = [] } = useTeachers();
  const { data: students = [] } = useStudents();
  const activeStudents = students.filter((s) => s.status === "ativo");

  // Ao mudar filtro de status, voltar para a primeira página
  useEffect(() => {
    setPage(0);
  }, [filters.status, setPage]);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const { data: summary } = useClassLogsSummary(effectiveTeacherId ?? undefined);
  const createLog = useCreateClassLog();
  const createLogWithFinancial = useCreateClassLogWithFinancial();
  const updateLog = useUpdateClassLog();
  const deleteLog = useDeleteClassLog();

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

      if (filters.teacherId !== "all" && log.teacher_id !== filters.teacherId && log.students?.teacher_id !== filters.teacherId) return false;

      // Filtro pacote / individual (financial_record_via_package = true → pacote)
      if (filters.classType === "pacote" && !log.financial_record_via_package) return false;
      if (filters.classType === "individual" && log.financial_record_via_package) return false;

      // Filtro de período primeiro (antes de verificar status)
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

      const badge = getClassStatusBadge(log);
      const status =
        badge.label === "Concluída"
          ? "concluida"
          : badge.label === "Agendada" || badge.label === "Em andamento"
            ? "agendada"
            : "avaliacao_pendente";

      // Filtro de status:
      // - "all": mostra tudo (agendada + avaliação pendente + concluídas)
      // - "em_aberto": mostra aulas não concluídas OU aulas concluídas com pagamento não finalizado
      // - valores específicos: filtram por esse status exato
      if (filters.status === "em_aberto") {
        const isNotCompleted = status !== "concluida";
        if (isNotCompleted) {
          // Aula não concluída, mostra
          return true;
        }
        // Aula concluída: só mostra se tem cobrança pendente/atrasada
        if (!log.financial_records) {
          return false;
        }
        const financialStatus = getFinancialActualStatus({
          status: log.financial_records.status,
          due_date: log.financial_records.due_date
        });
        return financialStatus !== "pago";
      }
      
      if (filters.status !== "all" && filters.status !== status) {
        return false;
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
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPackageDialogOpen(true)}
          >
            <Package className="h-4 w-4 mr-2" />
            Cadastrar pacote
          </Button>
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
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 laptop:grid-cols-4">
        <StatCard
          title="Total de Aulas"
          value={summary?.totalClasses ?? 0}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Presenças"
          value={summary?.totalPresent ?? 0}
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Taxa de Presença"
          value={`${attendanceRate}%`}
          icon={Percent}
          variant="default"
        />
        <StatCard
          title="Média Geral"
          value={summary?.averageGrade != null ? summary.averageGrade.toFixed(1) : "—"}
          icon={Award}
          variant="primaryHighlight"
        />
      </div>

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
        students={activeStudents}
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
          <div className="overflow-x-auto min-w-0">
            <table className="w-full table-auto text-sm mobile:text-xs tablet:text-xs laptop:text-xs">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className={tableThLarge}>Aluno</th>
                  {showTeacherColumn ? (
                    <th className={cn(tableThLarge, "hidden sm:table-cell")}>Informações</th>
                  ) : (
                    <th className={cn(tableThLarge, "hidden sm:table-cell")}>Título da aula</th>
                  )}
                  <th className={tableThSmall}>Data</th>
                  <th className={cn(tableThSmall, "hidden sm:table-cell")}>Duração</th>
                  <th className={tableThSmall}>Nota</th>
                  <th className={cn(tableThSmall, "hidden xl:table-cell")}>Financeiro</th>
                  <th className={tableThSmallRight}>Ações</th>
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
                      <td className={tableTdLarge}>
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-accent-foreground">
                              {log.students?.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs font-medium">
                                {log.students?.name || "Aluno não encontrado"}
                              </p>
                              <StatusBadge variant={getClassStatusBadge(log).variant}>
                                {getClassStatusBadge(log).label}
                              </StatusBadge>
                            </div>
                            {lastUpdatedAt && (
                              <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground whitespace-nowrap">
                                {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      {showTeacherColumn ? (
                        <td className={cn(tableTdLarge, "hidden sm:table-cell")}>
                          <div className="flex flex-col gap-0.5 max-w-[200px]">
                            <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs font-medium text-foreground whitespace-normal line-clamp-2" title={getClassLogDisplayTitle(log)}>
                              {getClassLogDisplayTitle(log)}
                            </span>
                            <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground whitespace-nowrap">
                              {teacherName}
                            </span>
                          </div>
                        </td>
                      ) : (
                        <td className={cn(tableTdLarge, "hidden sm:table-cell")}>
                          <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs font-medium text-foreground whitespace-normal line-clamp-2 max-w-[200px]" title={getClassLogDisplayTitle(log)}>
                            {getClassLogDisplayTitle(log)}
                          </span>
                        </td>
                      )}
                      <td className={tableTdSmall}>
                        {(() => {
                          const { date, timeRange } = formatClassDateAndTime(log);
                          return (
                            <div className="flex flex-col gap-0.5 text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                              <span>{date}</span>
                              {timeRange && <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px]">{timeRange}</span>}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={cn(tableTdSmall, "hidden sm:table-cell")}>
                        <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                          {formatDuration(log.duration_minutes)}
                        </span>
                      </td>
                      <td className={tableTdSmall}>
                        <span
                          className={`text-sm mobile:text-xs tablet:text-xs laptop:text-xs font-medium ${
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
                      <td className={cn(tableTdSmall, "hidden xl:table-cell")}>
                        {log.financial_records ? (
                          <StatusBadge
                            variant={getPaymentStatusVariant(
                              getFinancialActualStatus({
                                status: log.financial_records.status,
                                due_date: log.financial_records.due_date,
                              })
                            )}
                          >
                            <Receipt className="h-3 w-3" />
                            {getPaymentStatusLabel(
                              getFinancialActualStatus({
                                status: log.financial_records.status,
                                due_date: log.financial_records.due_date,
                              })
                            )}
                          </StatusBadge>
                        ) : (
                          <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">Sem cobrança</span>
                        )}
                      </td>
                      <td className={tableTdActions}>
                        <div className="flex items-center justify-end gap-2 h-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => {
                              setLogForDetailSheet(log);
                              setDetailSheetOpen(true);
                            }}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                            className={`h-8 w-[7rem] shrink-0 border-none ${
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
                            {isClassEvaluationBlocked(log) && log.attendance == null
                              ? "Avaliar"
                              : log.attendance != null
                                ? "Atualizar"
                                : "Avaliar"}
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
            <div className="border-t px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 flex items-center justify-between gap-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {totalCount > 0
                  ? `${page * 10 + 1}-${Math.min((page + 1) * 10, totalCount)} de ${totalCount}`
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
                          variant={getPaymentStatusVariant(
                            getFinancialActualStatus({
                              status: log.financial_records.status,
                              due_date: log.financial_records.due_date,
                            })
                          )}
                          className="flex items-center gap-1"
                        >
                          <Receipt className="h-3 w-3" />
                          {getPaymentStatusLabel(
                            getFinancialActualStatus({
                              status: log.financial_records.status,
                              due_date: log.financial_records.due_date,
                            })
                          )}
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
                <div className="flex items-center gap-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setLogForDetailSheet(log);
                      setDetailSheetOpen(true);
                    }}
                    title="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                    className={`h-8 w-[7rem] shrink-0 border-none ${
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
                    {isClassEvaluationBlocked(log) && log.attendance == null
                      ? "Avaliar"
                      : log.attendance != null
                        ? "Atualizar"
                        : "Avaliar"}
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
            <div className="rounded-lg border bg-card px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 flex items-center justify-between gap-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {totalCount > 0 ? `${page * 10 + 1}-${Math.min((page + 1) * 10, totalCount)} de ${totalCount}` : "0 registros"}
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

      {/* Detalhes da aula (sheet lateral) */}
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
            ? logForDetailSheet.teachers?.name ??
              (logForDetailSheet.teacher_id ? teacherMap.get(logForDetailSheet.teacher_id) : null) ??
              (logForDetailSheet.students?.teacher_id ? teacherMap.get(logForDetailSheet.students.teacher_id) : null) ??
              "Sem professor"
            : "—"
        }
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

      {/* Pacote de aulas */}
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
