import { useState } from "react";
import TeacherLayout from "@/components/layout/TeacherLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogFormDialog } from "@/components/classes/ClassLogFormDialog";
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

function formatDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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

  // RLS garante que o professor só veja/edite aulas dos seus alunos
  const { data: logs = [], isLoading, error } = useClassLogs();
  const { data: summary } = useClassLogsSummary();
  const createLog = useCreateClassLog();
  const createLogWithFinancial = useCreateClassLogWithFinancial();
  const updateLog = useUpdateClassLog();
  const deleteLog = useDeleteClassLog();

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
      <TeacherLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
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
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Aluno
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                      Aula / Professor
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Data
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Nota
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden xl:table-cell w-0 whitespace-nowrap">
                      Financeiro
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden 2xl:table-cell">
                      Valor
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                      Feedback
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log) => {
                    const lastUpdatedAt = (log as any).updated_at as
                      | string
                      | null
                      | undefined;

                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 align-top">
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
                                <StatusBadge
                                  variant={log.attendance ? "success" : "destructive"}
                                >
                                  {log.attendance ? "Presente" : "Ausente"}
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
                        <td className="px-4 py-3 align-top hidden lg:table-cell">
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
                        <td className="px-4 py-3 align-top">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(log.class_date as string)}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="text-sm font-medium">
                            {typeof log.grade === "number"
                              ? Number(log.grade).toFixed(1)
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top hidden xl:table-cell whitespace-nowrap">
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
                        <td className="px-4 py-3 align-top hidden 2xl:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {log.financial_records
                              ? `R$ ${formatCurrency(Number(log.financial_records.amount))}`
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                            {log.feedback || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isMutating}
                              >
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
              <AlertDialogTitle>Excluir registro de aula</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este registro de aula? Esta ação não
                pode ser desfeita.
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
    </TeacherLayout>
  );
};

export default TeacherPedagogicalPage;
