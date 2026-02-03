import { EmptyState } from "@/components/ui/empty-state";
import { EmptyFinancialState } from "@/components/ui/contextual-empty-states";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/formatters";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUndoFinancialPayment } from "@/hooks/useFinancialRecords";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
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
import { Search, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  FinancialFilters,
  type FinancialFiltersState,
} from "@/components/filters/FinancialFilters";
import { defaultFinancialFilters } from "@/components/filters/filterDefaults";
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
import { TableSkeleton } from "@/components/ui/table-skeleton";

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

interface FinancialViewProps {
  title?: string;
  subtitle?: string;
  showTeacherColumn?: boolean;
  enableTeacherSelection?: boolean;
  autoTeacherId?: string | null;
}

export function FinancialView({
  title = "Financeiro",
  subtitle = "Gerencie cobranças e pagamentos",
  showTeacherColumn = true,
  enableTeacherSelection = true,
  autoTeacherId = null,
}: FinancialViewProps) {
  const undoPayment = useUndoFinancialPayment();
  const [filters, setFilters] = useState<FinancialFiltersState>(defaultFinancialFilters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  const [recordToConfirm, setRecordToConfirm] = useState<FinancialRecordWithRelations | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<FinancialRecordWithRelations | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<FinancialRecordWithRelations | null>(null);
  const [recordToUndo, setRecordToUndo] = useState<FinancialRecordWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const listTopRef = useRef<HTMLDivElement>(null);

  const {
    data: records = [],
    isLoading,
    error,
    page,
    setPage,
    hasMore,
    totalCount,
    isFetching,
  } = useFinancialRecords(autoTeacherId, {
    pageSize: 20,
    filters: {
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sortBy: filters.sortBy,
    },
  });
  const { data: summary } = useFinancialSummary(autoTeacherId);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const { data: teachers = [] } = useTeachers();
  const createRecord = useCreateFinancialRecord();
  const markAsPaid = useMarkAsPaid();
  const updateRecord = useUpdateFinancialRecord();
  const deleteRecord = useDeleteFinancialRecord();

  // Add actual status to records
  const recordsWithActualStatus = records.map((record) => ({
    ...record,
    actualStatus: getFinancialActualStatus(record),
  }));

  const filteredRecords = useMemo(() => {
    let result = recordsWithActualStatus.filter((record) => {
      const searchLower = filters.search.toLowerCase().trim();
      const studentName = record.students?.name || "";
      const studentEmail = (record.students as { email?: string | null })?.email || "";
      const studentCpf = (record.students as { cpf?: string | null })?.cpf || "";
      const studentPhone = (record.students as { phone?: string | null })?.phone || "";
      const searchDigits = searchLower.replace(/\D/g, "");
      const matchesSearch =
        !searchLower ||
        studentName.toLowerCase().includes(searchLower) ||
        studentEmail.toLowerCase().includes(searchLower) ||
        (searchDigits.length > 0 &&
          (studentCpf.replace(/\D/g, "").includes(searchDigits) ||
            studentPhone.replace(/\D/g, "").includes(searchDigits)));
      if (!matchesSearch) return false;

      const matchesStatus = filters.status === "all" || record.actualStatus === filters.status;
      if (!matchesStatus) return false;

      const dueDate = record.due_date ? new Date(record.due_date + "T12:00:00") : null;
      if (filters.dateFrom && dueDate) {
        const from = new Date(filters.dateFrom);
        if (dueDate < from) return false;
      }
      if (filters.dateTo && dueDate) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (dueDate > to) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      const dueA = new Date((a.due_date || "") + "T12:00:00").getTime();
      const dueB = new Date((b.due_date || "") + "T12:00:00").getTime();
      const amtA = Number(a.amount) || 0;
      const amtB = Number(b.amount) || 0;

      if (filters.sortBy === "due_asc") return dueA - dueB;
      if (filters.sortBy === "due_desc") return dueB - dueA;
      if (filters.sortBy === "amount_desc") return amtB - amtA;
      if (filters.sortBy === "amount_asc") return amtA - amtB;
      return 0;
    });
    return result;
  }, [recordsWithActualStatus, filters]);

  const teacherMap = new Map<string, string>();
  teachers.forEach((t: Teacher) => {
    if (t.id && t.name) {
      teacherMap.set(t.id, t.name);
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
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

      {/* Filtros avançados */}
      <FinancialFilters
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPage(0);
        }}
        onReset={() => {
          setFilters(defaultFinancialFilters);
          setPage(0);
        }}
      />

        {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            Erro ao carregar registros financeiros. Tente novamente.
          </p>
        </div>
      )}

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} columns={8} />
        ) : !error ? (
          <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Aluno
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell whitespace-nowrap">
                    Aula Vinculada
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden sm:table-cell whitespace-nowrap">
                    Descrição
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Valor
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell whitespace-nowrap">
                    Método
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden md:table-cell whitespace-nowrap">
                    Vencimento
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const lastUpdatedAt = record.updated_at || record.created_at;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-sm">
                          {record.students?.name || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {record.class_logs ? (
                          <div className="flex flex-col text-sm text-muted-foreground">
                            <span>
                              {record.students?.name}
                              {" | "}
                              {record.class_logs.title?.trim()
                                ? record.class_logs.title
                                : formatDate(record.class_logs.class_date)}
                            </span>
                            {showTeacherColumn && record.students?.teacher_id && (
                              <span className="text-xs text-muted-foreground/80">
                                Professor: {teacherMap.get(record.students.teacher_id) || "—"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground/70">
                            Sem aula vinculada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex flex-col text-sm text-muted-foreground">
                          <span>{record.description || "—"}</span>
                          {lastUpdatedAt && (
                            <span className="text-[11px] mt-0.5">
                              {`Editado em ${formatDateTime(lastUpdatedAt)}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-sm">
                          {formatCurrency(Number(record.amount))}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell whitespace-nowrap">
                        <p className="text-sm text-muted-foreground">
                          {record.payment_method || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell whitespace-nowrap">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(record.due_date)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setRecordToEdit(record);
                                      setIsFormOpen(true);
                                    }}
                                  >
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
                              className="h-8 bg-warning text-white font-semibold hover:bg-warning/90 border-none shadow"
                              disabled={undoPayment.isPending}
                              onClick={() => {
                                setRecordToUndo(record);
                                setUndoDialogOpen(true);
                              }}
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
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRecords.length === 0 && (
            records.length === 0 ? (
              <EmptyFinancialState
                message="As cobranças são criadas ao registrar aulas. Registre uma aula na aba Aulas para gerar cobranças."
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Nenhum resultado"
                message="Ajuste os filtros acima ou limpe a busca"
              />
            )
          )}
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
        ) : null}

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
        enableTeacherSelection={enableTeacherSelection}
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

      {/* Undo Payment (Desfazer Cobrança) Dialog */}
      <AlertDialog
        open={undoDialogOpen}
        onOpenChange={(open) => {
          setUndoDialogOpen(open);
          if (!open) setRecordToUndo(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer cobrança</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Deseja desfazer o pagamento da cobrança de{" "}
                  <strong>{recordToUndo?.students?.name}</strong> no valor de{" "}
                  <strong>{recordToUndo ? formatCurrency(Number(recordToUndo.amount)) : ""}</strong>?
                </p>
                {recordToUndo?.class_logs && recordToUndo.class_logs.attendance != null ? (
                  <p className="text-destructive font-medium">
                    Esta cobrança está vinculada a uma aula já concluída/confirmada.
                    Deseja desfazer mesmo assim?
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={undoPayment.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (recordToUndo) {
                  undoPayment.mutate(recordToUndo.id, {
                    onSettled: () => {
                      setUndoDialogOpen(false);
                      setRecordToUndo(null);
                    },
                  });
                }
              }}
              disabled={undoPayment.isPending}
            >
              {undoPayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desfazendo...
                </>
              ) : (
                "Desfazer cobrança"
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
            <AlertDialogTitle>
              {recordToConfirm?.class_logs && recordToConfirm.class_logs.attendance == null
                ? "Atenção: confirmar pagamento antecipado"
                : "Confirmar pagamento"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {recordToConfirm?.class_logs && recordToConfirm.class_logs.attendance == null ? (
                  <p>
                    <span className="font-medium text-foreground block mb-1">
                      Esta cobrança está vinculada a uma aula que ainda não foi concluída.
                    </span>
                    O pagamento já foi realizado? Ao confirmar, a cobrança de{" "}
                    <strong>{recordToConfirm?.students?.name}</strong> no valor de{" "}
                    <strong>{recordToConfirm ? formatCurrency(Number(recordToConfirm.amount)) : ""}</strong>{" "}
                    será marcada como paga.
                  </p>
                ) : (
                  <p>
                    Deseja marcar como pago a cobrança de{" "}
                    <strong>{recordToConfirm?.students?.name}</strong> no valor de{" "}
                    <strong>{recordToConfirm ? formatCurrency(Number(recordToConfirm.amount)) : ""}</strong>?
                  </p>
                )}
              </div>
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
  );
}
