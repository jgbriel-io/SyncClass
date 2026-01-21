import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUndoFinancialPayment } from "@/hooks/useFinancialRecords";
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
import { Search, Plus, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FinancialFormDialog } from "@/components/financial/FinancialFormDialog";
import {
  useFinancialRecords,
  useFinancialSummary,
  useCreateFinancialRecord,
  useMarkAsPaid,
  useUpdateFinancialRecord,
  useDeleteFinancialRecord,
  FinancialRecordInsert,
  FinancialRecordWithRelations,
} from "@/hooks/useFinancialRecords";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

type PaymentStatus = "pendente" | "atrasado" | "pago";

const statusLabels: Record<PaymentStatus, string> = {
  pendente: "Pendente",
  atrasado: "Atrasado",
  pago: "Pago",
};

const statusVariants: Record<PaymentStatus, "warning" | "destructive" | "success"> = {
  pendente: "warning",
  atrasado: "destructive",
  pago: "success",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

function formatDateTime(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
}

// Calculate actual status based on due_date
function getActualStatus(record: FinancialRecordWithRelations): PaymentStatus {
  if (record.status === "pago") return "pago";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(record.due_date + "T00:00:00");
  
  if (dueDate < today) return "atrasado";
  return "pendente";
}

export default function FinancialPage() {
    const undoPayment = useUndoFinancialPayment();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  const [recordToConfirm, setRecordToConfirm] = useState<FinancialRecordWithRelations | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<FinancialRecordWithRelations | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<FinancialRecordWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: records = [], isLoading, error } = useFinancialRecords();
  const { data: summary } = useFinancialSummary();
  const createRecord = useCreateFinancialRecord();
  const markAsPaid = useMarkAsPaid();
  const updateRecord = useUpdateFinancialRecord();
  const deleteRecord = useDeleteFinancialRecord();

  // Add actual status to records
  const recordsWithActualStatus = records.map((record) => ({
    ...record,
    actualStatus: getActualStatus(record),
  }));

  const filteredRecords = recordsWithActualStatus.filter((record) => {
    const studentName = record.students?.name || "";
    const matchesSearch = studentName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || record.actualStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateRecord = (data: FinancialRecordInsert) => {
    createRecord.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleEditRecord = (data: FinancialRecordInsert) => {
    if (recordToEdit) {
      updateRecord.mutate({ id: recordToEdit.id, ...data }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setRecordToEdit(null);
        },
      });
    }
  };

  const handleDeleteRecord = () => {
    if (recordToDelete) {
      deleteRecord.mutate(recordToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setRecordToDelete(null);
        },
      });
    }
  };

  const openConfirmPayment = (record: FinancialRecordWithRelations) => {
    setRecordToConfirm(record);
    setConfirmPaymentId(record.id);
  };

  const handleConfirmPayment = () => {
    if (confirmPaymentId) {
      markAsPaid.mutate(confirmPaymentId, {
        onSuccess: () => {
          setConfirmPaymentId(null);
          setRecordToConfirm(null);
        },
      });
    }
  };

  // Calculate summary with actual status
  const actualSummary = {
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0,
    countPending: 0,
    countPaid: 0,
    countOverdue: 0,
  };

  recordsWithActualStatus.forEach((record) => {
    const amount = Number(record.amount) || 0;
    if (record.actualStatus === "pago") {
      actualSummary.totalPaid += amount;
      actualSummary.countPaid++;
    } else if (record.actualStatus === "atrasado") {
      actualSummary.totalOverdue += amount;
      actualSummary.countOverdue++;
    } else {
      actualSummary.totalPending += amount;
      actualSummary.countPending++;
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie cobranças e pagamentos
            </p>
          </div>
          <Button onClick={() => {
            setRecordToEdit(null);
            setIsFormOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">A receber</p>
            <p className="text-2xl font-semibold mt-1">
              {formatCurrency(actualSummary.totalPending)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {actualSummary.countPending} cobrança{actualSummary.countPending !== 1 && "s"} pendente{actualSummary.countPending !== 1 && "s"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">Recebido</p>
            <p className="text-2xl font-semibold mt-1 text-success">
              {formatCurrency(actualSummary.totalPaid)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {actualSummary.countPaid} pagamento{actualSummary.countPaid !== 1 && "s"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">Em atraso</p>
            <p className="text-2xl font-semibold mt-1 text-destructive">
              {formatCurrency(actualSummary.totalOverdue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {actualSummary.countOverdue} cobrança{actualSummary.countOverdue !== 1 && "s"}
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="atrasado">Atrasados</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
            </SelectContent>
          </Select>
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
              Erro ao carregar registros financeiros. Tente novamente.
            </p>
          </div>
        )}

        {/* Table */}
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
                      Aula Vinculada
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden sm:table-cell">
                      Descrição
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Valor
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                      Método
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                      Vencimento
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm">
                          {record.students?.name || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {record.class_logs ? (
                          <p className="text-sm text-muted-foreground">
                            {record.students?.name}
                            {" | "}
                            {record.class_logs.title?.trim()
                              ? record.class_logs.title
                              : formatDate(record.class_logs.class_date)}
                          </p>
                        ) : (
                          <span className="text-sm text-muted-foreground/70">
                            Sem aula vinculada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <p className="text-sm text-muted-foreground">
                          {record.description || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm">
                          {formatCurrency(Number(record.amount))}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-muted-foreground">
                          {record.payment_method || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(record.due_date)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge variant={statusVariants[record.actualStatus]}>
                          {statusLabels[record.actualStatus]}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {record.actualStatus !== "pago" ? (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setRecordToEdit(record);
                                    setIsFormOpen(true);
                                  }}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setRecordToDelete(record);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                size="sm"
                                className="h-8 bg-[#25D366] text-white hover:bg-[#1ebe57] border-none"
                                onClick={() => openConfirmPayment(record)}
                              >
                                <Check className="h-3.5 w-3.5 mr-1.5" />
                                Confirmar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 bg-yellow-400 text-white font-semibold hover:bg-yellow-500 border-none shadow"
                              disabled={undoPayment.isPending}
                              onClick={() => undoPayment.mutate(record.id)}
                            >
                              {undoPayment.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Desfazendo...
                                </>
                              ) : (
                                "Desfazer Cobrança"
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRecords.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {records.length === 0
                  ? "Nenhuma cobrança cadastrada ainda"
                  : "Nenhuma cobrança encontrada com esses filtros"}
              </div>
            )}
          </div>
        )}

        {/* Create Form Dialog */}
        <FinancialFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setRecordToEdit(null);
          }}
          onSubmit={recordToEdit ? handleEditRecord : handleCreateRecord}
          isLoading={createRecord.isPending || updateRecord.isPending}
          initialData={recordToEdit || null}
          enableTeacherSelection
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a cobrança de {recordToDelete?.students?.name} no valor de <strong>{recordToDelete ? formatCurrency(Number(recordToDelete.amount)) : ""}</strong>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteRecord.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRecord}
                disabled={deleteRecord.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteRecord.isPending ? (
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

        {/* Confirm Payment Dialog */}
        <AlertDialog
          open={!!confirmPaymentId}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmPaymentId(null);
              setRecordToConfirm(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja marcar como pago a cobrança de{" "}
                <strong>{recordToConfirm?.students?.name}</strong> no valor de{" "}
                <strong>{recordToConfirm ? formatCurrency(Number(recordToConfirm.amount)) : ""}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={markAsPaid.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmPayment}
                disabled={markAsPaid.isPending}
              >
                {markAsPaid.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Confirmar Pagamento"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
