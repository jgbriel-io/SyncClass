import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
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
import {
  Search,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Receipt,
  BookOpen,
  Check,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogFormDialog } from "@/components/classes/ClassLogFormDialog";
import { PostClassDialog } from "@/components/classes/PostClassDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

function getClassStatusBadge(log: {
  class_date: string;
  attendance: boolean | null;
  start_at?: string | null;
  end_at?: string | null;
}) {
  return getClassStatusWithTime(log);
}

const TeacherPedagogicalPage = () => {
  const { user, role, isLoading: authLoading } = useAuth();

  // Buscar o teacher_id vinculado ao usuário logado
  const { data: teacherId, isLoading: teacherIdLoading } = useQuery({
    queryKey: ["teacherId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("teacher_id")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching teacher_id:", error);
        return null;
      }

      return data?.teacher_id as string | null;
    },
    enabled: !!user?.id && role === "teacher",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ClassLogWithStudent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<ClassLogWithStudent | null>(null);
  const [postClassDialogOpen, setPostClassDialogOpen] = useState(false);
  const [logForPostClass, setLogForPostClass] = useState<ClassLogWithStudent | null>(null);

  // RLS garante que o professor só veja/edite aulas dos seus alunos
  const { data: logs = [], isLoading, error } = useClassLogs(teacherId ?? undefined);
  const { data: summary } = useClassLogsSummary(teacherId);
  const createLog = useCreateClassLog();
  const createLogWithFinancial = useCreateClassLogWithFinancial();
  const updateLog = useUpdateClassLog();
  const deleteLog = useDeleteClassLog();

  const logsPendingRegistration = logs.filter(
    (log) => !isClassEvaluationBlocked(log) && log.attendance == null
  );

  const filteredLogs = logs.filter((log) => {
    const studentName = log.students?.name || "";
    return studentName.toLowerCase().includes(searchQuery.toLowerCase());
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
  const currentTeacherName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Professor";

  if (authLoading || teacherIdLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Aulas</h1>
            <p className="text-muted-foreground mt-1">
              Registro de aulas, presença e desempenho dos seus alunos.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedLog(null);
              setIsFormOpen(true);
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
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

        {/* Conferência: aulas passadas sem presença */}
        {logsPendingRegistration.length > 0 && (
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-warning" />
              <p className="text-sm font-medium">
                <span className="font-semibold">{logsPendingRegistration.length}</span>{" "}
                {logsPendingRegistration.length === 1
                  ? "aula pendente de feedback"
                  : "aulas pendentes de feedback"}
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Erro ao carregar registros de aula. Tente novamente.
            </p>
          </div>
        )}

        {/* Tabela de aulas */}
        {!isLoading && !error && (
          <div className="rounded-lg border bg-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Aluno
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                      Aula / Professor
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Data
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Nota
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell w-0 whitespace-nowrap">
                      Financeiro
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell">
                      Valor
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                      Feedback
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const lastUpdatedAt = log.updated_at;

                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-accent-foreground">
                                {log.students?.name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium truncate max-w-[180px]">
                                  {log.students?.name || "Aluno não encontrado"}
                                </p>
                                <StatusBadge variant={getClassStatusBadge(log).variant}>
                                  {getClassStatusBadge(log).label}
                                </StatusBadge>
                              </div>
                              {lastUpdatedAt && (
                                <p className="text-[11px] text-muted-foreground">
                                  {`Editado em ${format(
                                    new Date(lastUpdatedAt),
                                    "dd/MM/yyyy HH:mm",
                                    { locale: ptBR }
                                  )}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top hidden lg:table-cell">
                          <div className="min-w-0 space-y-1">
                            {log.title && (
                              <p className="text-sm font-semibold text-foreground break-all whitespace-normal">
                                {log.title}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {currentTeacherName}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
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
                        <td className="px-6 py-4 align-top">
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
                        <td className="px-6 py-4 align-top hidden 2xl:table-cell whitespace-nowrap">
                          <span className={log.financial_records ? "text-sm font-medium tabular-nums" : "text-sm font-medium text-foreground"}>
                            {log.financial_records
                              ? formatCurrency(Number(log.financial_records.amount))
                              : "sem cobrança"}
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
                              disabled={isMutating || (isClassEvaluationBlocked(log) && log.attendance == null)}
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
              <div className="text-center py-10 text-muted-foreground border-t">
                {logs.length === 0
                  ? "Nenhuma aula registrada ainda"
                  : "Nenhum registro encontrado"}
              </div>
            )}
          </div>
        )}

        {/* Dialogs */}
        <PostClassDialog
          open={postClassDialogOpen}
          onOpenChange={(open) => {
            setPostClassDialogOpen(open);
            if (!open) setLogForPostClass(null);
          }}
          classLog={logForPostClass}
          onSuccess={() => setLogForPostClass(null)}
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
          teacherId={teacherId || undefined}
        />

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
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default TeacherPedagogicalPage;
