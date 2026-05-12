import { EmptyState } from "@/components/ui/empty-state";
import { EmptyFinancialState } from "@/components/ui/contextual-empty-states";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatters";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { useStudents } from "@/hooks/useStudents";
import { Search, DollarSign, TrendingUp } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  FinancialFilters,
  type FinancialFiltersState,
} from "@/components/filters/FinancialFilters";
import { defaultFinancialFilters } from "@/components/filters/filterDefaults";
import { FinancialFormDialog } from "@/components/financial/FinancialFormDialog";
import { FinancialUndoDialog } from "@/components/financial/FinancialUndoDialog";
import { FinancialDeleteDialog } from "@/components/financial/FinancialDeleteDialog";
import { FinancialConfirmPaymentDialog } from "@/components/financial/FinancialConfirmPaymentDialog";
import { FinancialPaymentHistoryDialog } from "@/components/financial/FinancialPaymentHistoryDialog";
import {
  useFinancialRecords,
  useFinancialSummary,
  useCreateFinancialRecord,
  useUpdateFinancialRecord,
  useUndoFinancialPayment,
  FinancialRecordInsert,
  FinancialRecordWithRelations,
} from "@/hooks/useFinancialRecords";
import { FinancialTableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForecastedBilling } from "@/hooks/useForecastedBilling";
import { FinancialTableRow } from "@/components/financial/FinancialTableRow";
import { COL as FIN_COL, TABLE_MIN_W as FIN_TABLE_MIN_W } from "@/components/financial/FinancialTableRow.constants";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";

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
  const [filters, setFilters] = useState<FinancialFiltersState>(defaultFinancialFilters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmPaymentRecord, setConfirmPaymentRecord] = useState<FinancialRecordWithRelations | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<FinancialRecordWithRelations | null>(null);
  const [recordToUndo, setRecordToUndo] = useState<FinancialRecordWithRelations | null>(null);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FinancialRecordWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  const updateRecord = useUpdateFinancialRecord();
  const undoPayment = useUndoFinancialPayment();

  // Add actual status to records
  const recordsWithActualStatus = records.map((record) => ({
    ...record,
    actualStatus: getFinancialActualStatus(record),
  }));

  const filteredRecords = useMemo(() => {
    let result = recordsWithActualStatus.filter((record) => {
      // Apenas busca por texto (não está no banco - CPF/telefone com dígitos)
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

      // Filtro de status
      if (filters.status !== "all" && record.actualStatus !== filters.status) {
        return false;
      }

      return true;
    });

    // Ordenação (não está no banco)
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
    createRecord.mutate(data, { onSuccess: () => setIsFormOpen(false) });
  };

  const handleEditRecord = (data: FinancialRecordInsert) => {
    if (recordToEdit) {
      updateRecord.mutate(
        { id: recordToEdit.id, ...data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setRecordToEdit(null);
          },
        }
      );
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
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
        <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
          <Table style={{ minWidth: FIN_TABLE_MIN_W }}>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted"
                  style={{ width: FIN_COL.ALUNO, minWidth: FIN_COL.ALUNO, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}
                >
                  Aluno
                </TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden lg:table-cell" style={{ width: FIN_COL.AULA, minWidth: FIN_COL.AULA }}>Aula Vinculada</TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: FIN_COL.VALOR, minWidth: FIN_COL.VALOR }}>Valor</TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden lg:table-cell" style={{ width: FIN_COL.METODO, minWidth: FIN_COL.METODO }}>Método</TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden md:table-cell" style={{ width: FIN_COL.VENCIMENTO, minWidth: FIN_COL.VENCIMENTO }}>Vencimento</TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: FIN_COL.STATUS, minWidth: FIN_COL.STATUS }}>Status</TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: FIN_COL.AVALIAR, minWidth: FIN_COL.AVALIAR }} aria-label="Avaliar" />
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: FIN_COL.ACOES, minWidth: FIN_COL.ACOES }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/40">
              {isLoading ? (
                <FinancialTableSkeleton rows={8} />
              ) : (
                filteredRecords.map((record) => (
                  <FinancialTableRow
                    key={record.id}
                    record={record}
                    showTeacherColumn={showTeacherColumn}
                    teacherMap={teacherMap}
                    isUndoing={undoPayment.isPending}
                    onViewHistory={setHistoryRecord}
                    onEdit={(record) => {
                      setRecordToEdit(record);
                      setIsFormOpen(true);
                    }}
                    onConfirmPayment={(record) => {
                      setHistoryRecord(record);
                    }}
                    onUndoPayment={(record) => {
                      setRecordToUndo(record);
                      setUndoDialogOpen(true);
                    }}
                    onDelete={(record) => {
                      setRecordToDelete(record);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading && filteredRecords.length === 0 && (
            <div className="border-t">
              {records.length === 0 ? (
                <EmptyFinancialState
                  message="As cobranças são criadas ao registrar aulas. Registre uma aula na aba Aulas para gerar cobranças."
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
          <TablePaginationBar
            page={page}
            pageSize={10}
            totalCount={totalCount}
            hasMore={!!hasMore}
            isFetching={isFetching}
            onPageChange={setPage}
          />
        </div>

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

      <FinancialUndoDialog
        open={undoDialogOpen}
        onOpenChange={(open) => {
          setUndoDialogOpen(open);
          if (!open) setRecordToUndo(null);
        }}
        record={recordToUndo}
        onClose={() => {
          setUndoDialogOpen(false);
          setRecordToUndo(null);
        }}
      />

      <FinancialDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setRecordToDelete(null);
        }}
        record={recordToDelete}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRecordToDelete(null);
        }}
      />

      <FinancialConfirmPaymentDialog
        open={!!confirmPaymentRecord}
        onOpenChange={(open) => {
          if (!open) setConfirmPaymentRecord(null);
        }}
        record={confirmPaymentRecord}
        onClose={() => setConfirmPaymentRecord(null)}
      />

      <FinancialPaymentHistoryDialog
        record={historyRecord}
        onClose={() => setHistoryRecord(null)}
        onConfirmPayment={(record) => setConfirmPaymentRecord(record)}
      />
    </div>
  );
}
