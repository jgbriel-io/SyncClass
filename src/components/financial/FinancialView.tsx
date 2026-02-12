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
import { useStudents } from "@/hooks/useStudents";
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
import { Search, Loader2, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, TrendingUp, Eye } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
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
import { useForecastedBilling } from "@/hooks/useForecastedBilling";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [historyRecord, setHistoryRecord] = useState<FinancialRecordWithRelations | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const { data: forecastedBilling } = useForecastedBilling(autoTeacherId);

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
    pageSize: 10,
    filters: {
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      studentId: filters.studentId,
      sortBy: filters.sortBy,
    },
  });
  const { data: summary } = useFinancialSummary(autoTeacherId);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const { data: teachers = [] } = useTeachers();
  const { data: students = [] } = useStudents();
  const activeStudents = students.filter((s) => s.status === "ativo");
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
      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();

      if (filters.sortBy === "due_asc") return dueA - dueB;
      if (filters.sortBy === "due_desc") return dueB - dueA;
      if (filters.sortBy === "amount_desc") return amtB - amtA;
      if (filters.sortBy === "amount_asc") return amtA - amtB;
      if (filters.sortBy === "created_desc") return createdB - createdA;
      if (filters.sortBy === "created_asc") return createdA - createdB;
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
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Summary Cards */}

      {/* Card grande de Previsão de Faturamento Mensal */}
      {forecastedBilling && (
        <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-card mb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Previsão de Faturamento Mensal</p>
              </div>
              <p className="text-2xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-primary">
                {formatCurrency(forecastedBilling.totalForecast)}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="text-success font-medium">
                  {formatCurrency(forecastedBilling.receivedThisMonth)} recebido
                </span>
                <span>•</span>
                <span className="font-medium">
                  {formatCurrency(forecastedBilling.pendingThisMonth)} pendente
                </span>
              </div>
              {/* Barra de progresso */}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(forecastedBilling.receivedPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {forecastedBilling.receivedPercentage}% recebido ({forecastedBilling.paidCount}/{forecastedBilling.totalCount} cobranças)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards financeiros padrão dashboard (exceto previsão mensal) */}
      <div className="grid gap-4 grid-cols-1 laptop:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Total recebido</p>
              <p className="text-2xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-success">
                {formatCurrency(actualSummary.totalPaid)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Total a receber</p>
              <p className="text-2xl laptop:text-xl desktop:text-2xl font-bold tracking-tight">
                {formatCurrency(actualSummary.totalPending + actualSummary.totalOverdue)}
              </p>
              <p className="text-xs text-muted-foreground">Pendentes + Em atraso</p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-warning/10">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Pendente</p>
              <p className="text-2xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {formatCurrency(actualSummary.totalPending)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Em atraso</p>
              <p className="text-2xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-destructive">
                {formatCurrency(actualSummary.totalOverdue)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-destructive/10">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
          </div>
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
        students={activeStudents}
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
          <div className="overflow-x-auto min-w-0">
            <table className="w-full table-auto text-sm mobile:text-xs tablet:text-xs laptop:text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className={tableThLarge}>Aluno</th>
                  <th className={cn(tableThMedium, "hidden lg:table-cell")}>Aula Vinculada</th>
                  <th className={cn(tableThMedium, "hidden sm:table-cell")}>Descrição</th>
                  <th className={tableThSmall}>Valor</th>
                  <th className={cn(tableThSmall, "hidden lg:table-cell")}>Método</th>
                  <th className={cn(tableThSmall, "hidden md:table-cell")}>Vencimento</th>
                  <th className={tableThSmall}>Status</th>
                  <th className={tableThSmallRight}>Ações</th>
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
                      <td className={tableTdLarge}>
                        <p className="font-medium text-sm mobile:text-xs tablet:text-xs laptop:text-xs">
                          {record.students?.name || "—"}
                        </p>
                      </td>
                      <td className={cn(tableTdMedium, "hidden lg:table-cell")}>
                        {record.class_logs ? (
                          <div className="flex flex-col text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                            <span>
                              {record.students?.name}
                              {" | "}
                              {record.class_logs.title?.trim()
                                ? record.class_logs.title
                                : formatDate(record.class_logs.class_date)}
                            </span>
                            {showTeacherColumn && record.students?.teacher_id && (
                              <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground/80">
                                Professor: {teacherMap.get(record.students.teacher_id) || "—"}
                              </span>
                            )}
                          </div>
                        ) : record.package_classes && record.package_classes.length > 0 ? (
                          <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                            Pacote mensal - {record.package_classes.length} aula(s)
                          </span>
                        ) : (
                          <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground/70">
                            Sem aula vinculada
                          </span>
                        )}
                      </td>
                      <td className={cn(tableTdMedium, "hidden sm:table-cell")}>
                        <div className="flex flex-col text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                          <span>
                            {record.package_classes && record.package_classes.length > 0
                              ? (() => {
                                  const sorted = [...record.package_classes].sort((a, b) =>
                                    a.class_date.localeCompare(b.class_date)
                                  );
                                  const first = formatDate(sorted[0].class_date);
                                  const last = formatDate(sorted[sorted.length - 1].class_date);
                                  return sorted.length === 1 ? first : `${first} a ${last}`;
                                })()
                              : (record.description || "—")}
                          </span>
                          {lastUpdatedAt && (
                            <span className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] mt-0.5">
                              {`Editado em ${formatDateTime(lastUpdatedAt)}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tableTdSmall}>
                        <p className="font-semibold text-sm mobile:text-xs tablet:text-xs laptop:text-xs">
                          {formatCurrency(Number(record.amount))}
                        </p>
                      </td>
                      <td className={cn(tableTdSmall, "hidden lg:table-cell")}>
                        <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                          {record.payment_method || "—"}
                        </p>
                      </td>
                      <td className={cn(tableTdSmall, "hidden md:table-cell")}>
                        <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                          {formatDate(record.due_date)}
                        </p>
                      </td>
                      <td className={tableTdSmall}>
                        <StatusBadge variant={statusVariants[record.actualStatus]}>
                          {statusLabels[record.actualStatus]}
                        </StatusBadge>
                      </td>
                      <td className={tableTdActions}>
                        <div className="flex items-center justify-end gap-2 h-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => setHistoryRecord(record)}
                            title="Ver histórico de pagamento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {record.actualStatus !== "pago" ? (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                                className="h-8 w-[7rem] shrink-0 bg-[#25D366] text-white hover:bg-[#1ebe57] border-none"
                                onClick={() => openConfirmPayment(record)}
                              >
                                Confirmar
                              </Button>
                            </>
                          ) : (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                                className="h-8 w-[7rem] shrink-0 whitespace-nowrap bg-warning text-white font-semibold hover:bg-warning/90 border-none shadow"
                                disabled={undoPayment.isPending}
                                onClick={() => {
                                  setRecordToUndo(record);
                                  setUndoDialogOpen(true);
                                }}
                              >
                                {undoPayment.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                                    Desfazendo...
                                  </>
                                ) : (
                                  "Desfazer"
                                )}
                              </Button>
                            </>
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

      {/* Mini modal: Histórico de pagamento */}
      <Dialog open={!!historyRecord} onOpenChange={(open) => !open && setHistoryRecord(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Histórico de pagamento</DialogTitle>
          </DialogHeader>
          {historyRecord && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {historyRecord.students?.name} · {formatCurrency(Number(historyRecord.amount))}
              </p>
              {historyRecord.actualStatus === "pago" && historyRecord.confirmed_at ? (
                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <p className="font-medium text-foreground">
                    Confirmado em {formatDateTime(historyRecord.confirmed_at)}
                  </p>
                  {historyRecord.confirmed_by?.full_name && (
                    <p className="text-muted-foreground mt-0.5">
                      por {historyRecord.confirmed_by.full_name}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum pagamento registrado para esta cobrança.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
