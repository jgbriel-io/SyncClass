import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyClassesState } from "@/components/ui/contextual-empty-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/formatters";
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
import { Search, Plus, Calendar, MoreHorizontal, Pencil, Trash2, Loader2, Receipt, BookOpen, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import format from "date-fns/format";
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

function formatDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
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

/** Badge de status: Concluída (já preencheu pós-aula), Agendada (futura), Avaliação pendente (passada sem concluir) */
function getClassStatusBadge(log: { class_date: string; attendance: boolean | null }) {
  const classDate = new Date(log.class_date + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  classDate.setHours(0, 0, 0, 0);
  const isFuture = classDate > today;

  if (log.attendance != null) return { label: "Concluída", variant: "success" as const };
  if (isFuture) return { label: "Agendada", variant: "info" as const };
  return { label: "Avaliação pendente", variant: "warning" as const };
}

function isClassDateFuture(classDate: string): boolean {
  const d = new Date(classDate + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

interface ClassesViewProps {
  title?: string;
  subtitle?: string;
  viewMode?: "table" | "cards";
  showTeacherColumn?: boolean;
  enableTeacherSelection?: boolean;
}

export function ClassesView({
  title = "Aulas",
  subtitle = "Registro de aulas e acompanhamento",
  viewMode = "table",
  showTeacherColumn = true,
  enableTeacherSelection = true,
}: ClassesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ClassLogWithStudent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<ClassLogWithStudent | null>(null);
  const [postClassDialogOpen, setPostClassDialogOpen] = useState(false);
  const [logForPostClass, setLogForPostClass] = useState<ClassLogWithStudent | null>(null);

  const { data: logs = [], isLoading, error } = useClassLogs();
  const { data: teachers = [] } = useTeachers();
  const { data: summary } = useClassLogsSummary();
  const createLog = useCreateClassLog();
  const createLogWithFinancial = useCreateClassLogWithFinancial();
  const updateLog = useUpdateClassLog();
  const deleteLog = useDeleteClassLog();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const logsPendingRegistration = logs.filter((log) => {
    const d = new Date(log.class_date + "T12:00:00");
    d.setHours(0, 0, 0, 0);
    return d <= todayStart && log.attendance == null;
  });

  const filteredLogs = logs.filter((log) => {
    const studentName = log.students?.name || "";
    return studentName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Mapa de professores para fallback (caso o join não traga o nome)
  const teacherMap = new Map<string, string>();
  teachers.forEach((t: Teacher) => {
    if (t.id && t.name) {
      teacherMap.set(t.id, t.name);
    }
  });

  const handleCreateOrUpdate = (data: ClassLogInsert) => {
    if (selectedLog) {
      updateLog.mutate(
        { id: selectedLog.id, ...data },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

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
          <div className="rounded-lg border bg-card shadow-card overflow-hidden">
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
                        <span className="text-sm text-muted-foreground">
                          {formatDate(log.class_date)}
                        </span>
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
                        <span className="text-sm font-medium tabular-nums">
                          {log.financial_records
                            ? formatCurrency(log.financial_records.amount)
                            : "—"}
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
                              log.attendance != null
                                ? "bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                                : "bg-[#25D366] text-white hover:bg-[#1ebe57]"
                            }`}
                            onClick={() => {
                              if (isClassDateFuture(log.class_date)) {
                                toast.warning("Esta aula ainda não ocorreu. Se a data mudou, clique em Editar.");
                                return;
                              }
                              setLogForPostClass(log);
                              setPostClassDialogOpen(true);
                            }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            {log.attendance != null ? "Atualizar" : "Avaliar"}
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
        </div>
        )}

        {/* Cards View (Teacher) */}
      {!isLoading && !error && viewMode === "cards" && (
        <div className="space-y-4">
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
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(log.class_date)}
                      </span>
                      {log.duration_minutes != null && (
                        <span className="flex items-center gap-1.5">
                          {formatDuration(log.duration_minutes)}
                        </span>
                      )}
                      {log.financial_records && (
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Receipt className="h-3.5 w-3.5" />
                          {formatCurrency(log.financial_records.amount)}
                        </span>
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
                      log.attendance != null
                        ? "bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                        : "bg-[#25D366] text-white hover:bg-[#1ebe57]"
                    }`}
                    onClick={() => {
                      if (isClassDateFuture(log.class_date)) {
                        toast.warning("Esta aula ainda não ocorreu. Se a data mudou, clique em Editar.");
                        return;
                      }
                      setLogForPostClass(log);
                      setPostClassDialogOpen(true);
                    }}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    {log.attendance != null ? "Atualizar" : "Avaliar"}
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
