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
  Plus,
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

const TeacherClassesPage = () => {
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

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Aulas</h1>
            <p className="text-muted-foreground mt-1">
              Registre suas aulas e, se quiser, já crie a cobrança vinculada.
            </p>
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

        {/* Timeline */}
        {!isLoading && !error && (
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
                        <StatusBadge
                          variant={log.attendance ? "success" : "destructive"}
                        >
                          {log.attendance ? "Presente" : "Ausente"}
                        </StatusBadge>
                        {/* Badge de cobrança */}
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
                        {log.financial_records && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Receipt className="h-3.5 w-3.5" />
                            R$ {log.financial_records.amount.toFixed(2).replace(".", ",")}
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
                  <div className="flex items-start gap-4">
                    {log.grade !== null && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Nota
                        </p>
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
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground rounded-lg border bg-card">
                {logs.length === 0
                  ? "Nenhuma aula registrada ainda"
                  : "Nenhum registro encontrado"}
              </div>
            )}
          </div>
        )}

        {/* Form Dialog */}
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
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o registro de aula de{" "}
                <strong>{logToDelete?.students?.name}</strong> do dia{" "}
                <strong>{logToDelete ? formatDate(logToDelete.class_date) : ""}</strong>?
                {logToDelete?.financial_records && (
                  <span className="block mt-2 text-warning">
                    ⚠️ Esta aula possui uma cobrança vinculada que também será afetada.
                  </span>
                )}
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
    </TeacherLayout>
  );
};

export default TeacherClassesPage;
