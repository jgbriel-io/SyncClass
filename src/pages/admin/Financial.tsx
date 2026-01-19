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
  FinancialRecordInsert,
  FinancialRecordWithStudent,
} from "@/hooks/useFinancialRecords";

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
function getActualStatus(record: FinancialRecordWithStudent): PaymentStatus {
  if (record.status === "pago") return "pago";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(record.due_date + "T00:00:00");
  
  if (dueDate < today) return "atrasado";
  return "pendente";
}

export default function FinancialPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  const [recordToConfirm, setRecordToConfirm] = useState<FinancialRecordWithStudent | null>(null);

  const { data: records = [], isLoading, error } = useFinancialRecords();
  const { data: summary } = useFinancialSummary();
  const createRecord = useCreateFinancialRecord();
  const markAsPaid = useMarkAsPaid();

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

  const openConfirmPayment = (record: FinancialRecordWithStudent) => {
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
          <Button onClick={() => setIsFormOpen(true)}>
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
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden sm:table-cell">
                      Descrição
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Valor
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
                        {record.actualStatus !== "pago" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => openConfirmPayment(record)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Baixar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Pago em {record.paid_at ? formatDateTime(record.paid_at) : "—"}
                          </span>
                        )}
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
          onOpenChange={setIsFormOpen}
          onSubmit={handleCreateRecord}
          isLoading={createRecord.isPending}
        />

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
