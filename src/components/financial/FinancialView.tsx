import { common } from "@/content";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyFinancialState } from "@/components/ui/contextual-empty-states";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { FinancialForecastCard } from "@/components/financial/FinancialForecastCard";
import { FinancialSummaryCards } from "@/components/financial/FinancialSummaryCards";
import { useStudents } from "@/hooks/useStudents";
import { Search } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { PeriodFilter as PeriodFilterWidget } from "@/components/ui/period-filter";
import {
  type PeriodFilter,
  getDateRangeForPeriod,
} from "@/lib/utils/periodFilter";
import {
  FinancialFilters,
  type FinancialFiltersState,
} from "@/components/filters/FinancialFilters";
import { defaultFinancialFilters } from "@/components/filters/filterDefaults";
import { FinancialFormDialog } from "@/components/financial/FinancialFormDialog";
import { FinancialRefundDialog } from "@/components/financial/FinancialRefundDialog";
import { FinancialDeleteDialog } from "@/components/financial/FinancialDeleteDialog";
import { FinancialPaymentHistoryDialog } from "@/components/financial/FinancialPaymentHistoryDialog";
import {
  useFinancialRecords,
  useFinancialSummary,
  useCreateFinancialRecord,
  useUpdateFinancialRecord,
  useUpdateFinancialStatus,
  FinancialRecordInsert,
  FinancialRecordWithRelations,
} from "@/hooks/useFinancialRecords";
import { FinancialTableSkeleton } from "@/components/ui/table-skeleton";
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
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForecastedBilling } from "@/hooks/useForecastedBilling";
import { FinancialTableRow } from "@/components/financial/FinancialTableRow";
import {
  COL as FIN_COL,
  TABLE_MIN_W as FIN_TABLE_MIN_W,
} from "@/components/financial/FinancialTableRow.constants";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { financial as financialContent } from "@/content";

interface FinancialViewProps {
  title?: string;
  subtitle?: string;
  showTeacherColumn?: boolean;
  enableTeacherSelection?: boolean;
  autoTeacherId?: string | null;
  isAdmin?: boolean;
}

export function FinancialView({
  title = "Financeiro",
  subtitle = "Gerencie cobranças e pagamentos",
  showTeacherColumn = true,
  enableTeacherSelection = true,
  autoTeacherId = null,
  isAdmin = false,
}: FinancialViewProps) {
  const [filters, setFilters] = useState<FinancialFiltersState>(
    defaultFinancialFilters
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] =
    useState<FinancialRecordWithRelations | null>(null);
  const [recordToRefund, setRecordToRefund] =
    useState<FinancialRecordWithRelations | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] =
    useState<FinancialRecordWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToCancel, setRecordToCancel] =
    useState<FinancialRecordWithRelations | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const cancelCharge = useUpdateFinancialStatus();
  const [historyRecord, setHistoryRecord] =
    useState<FinancialRecordWithRelations | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const isFirstScrollRef = useRef(true);
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const dateRange = getDateRangeForPeriod(period);
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
  const { data: summary } = useFinancialSummary(autoTeacherId, dateRange);

  useEffect(() => {
    if (isFirstScrollRef.current) {
      isFirstScrollRef.current = false;
      return;
    }
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const { data: teachers = [] } = useTeachers();
  const { data: students = [] } = useStudents();
  const activeStudents = students.filter((s) => s.status === "ativo");
  const createRecord = useCreateFinancialRecord();
  const updateRecord = useUpdateFinancialRecord();

  const recordsWithActualStatus = records.map((record) => ({
    ...record,
    actualStatus: getFinancialActualStatus(record),
  }));

  const filteredRecords = useMemo(() => {
    let result = recordsWithActualStatus.filter((record) => {
      const searchLower = filters.search.toLowerCase().trim();
      const studentName = record.students?.name || "";
      const studentEmail =
        (record.students as { email?: string | null })?.email || "";
      const studentCpf =
        (record.students as { cpf?: string | null })?.cpf || "";
      const studentPhone =
        (record.students as { phone?: string | null })?.phone || "";
      const searchDigits = searchLower.replace(/\D/g, "");
      const matchesSearch =
        !searchLower ||
        studentName.toLowerCase().includes(searchLower) ||
        studentEmail.toLowerCase().includes(searchLower) ||
        (searchDigits.length > 0 &&
          (studentCpf.replace(/\D/g, "").includes(searchDigits) ||
            studentPhone.replace(/\D/g, "").includes(searchDigits)));
      if (!matchesSearch) return false;

      if (filters.status !== "all" && record.actualStatus !== filters.status) {
        return false;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>
        <PeriodFilterWidget value={period} onChange={setPeriod} />
      </div>

      <FinancialForecastCard forecastedBilling={forecastedBilling} />
      <FinancialSummaryCards summary={summary} />

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

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            {financialContent.view.errorLoading}
          </p>
        </div>
      )}

      <div
        className="rounded-lg border bg-card shadow-card overflow-hidden"
        ref={listTopRef}
      >
        <Table style={{ minWidth: FIN_TABLE_MIN_W }}>
          <TableHeader>
            <TableRow>
              <TableHead
                className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap tablet:sticky tablet:left-0 z-30 bg-muted"
                style={{
                  width: FIN_COL.ALUNO,
                  minWidth: FIN_COL.ALUNO,
                  boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
                }}
              >
                {financialContent.view.colStudent}
              </TableHead>
              <TableHead
                className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden lg:table-cell"
                style={{ width: FIN_COL.AULA, minWidth: FIN_COL.AULA }}
              >
                {financialContent.view.colClass}
              </TableHead>
              <TableHead
                className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                style={{ width: FIN_COL.VALOR, minWidth: FIN_COL.VALOR }}
              >
                {financialContent.view.colAmount}
              </TableHead>
              <TableHead
                className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden lg:table-cell"
                style={{ width: FIN_COL.METODO, minWidth: FIN_COL.METODO }}
              >
                {financialContent.view.colMethod}
              </TableHead>
              <TableHead
                className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden md:table-cell"
                style={{
                  width: FIN_COL.VENCIMENTO,
                  minWidth: FIN_COL.VENCIMENTO,
                }}
              >
                {financialContent.view.colDueDate}
              </TableHead>
              <TableHead
                className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                style={{ width: FIN_COL.STATUS, minWidth: FIN_COL.STATUS }}
              >
                {financialContent.view.colStatus}
              </TableHead>
              {!isAdmin && (
                <TableHead
                  className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                  style={{ width: FIN_COL.AVALIAR, minWidth: FIN_COL.AVALIAR }}
                  aria-label={common.aria.evaluate}
                />
              )}
              <TableHead
                className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                style={{ width: FIN_COL.ACOES, minWidth: FIN_COL.ACOES }}
              >
                {financialContent.table.colActions}
              </TableHead>
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
                  isAdmin={isAdmin}
                  onViewHistory={setHistoryRecord}
                  onEdit={(record) => {
                    setRecordToEdit(record);
                    setIsFormOpen(true);
                  }}
                  onRequestRefund={(record) => {
                    setRecordToRefund(record);
                    setRefundDialogOpen(true);
                  }}
                  onCancelCharge={(record) => {
                    setRecordToCancel(record);
                    setCancelDialogOpen(true);
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
                message={financialContent.emptyState.chargeCreationHint}
              />
            ) : (
              <EmptyState
                icon={Search}
                title={common.table.noResults}
                message={financialContent.emptyState.filterEmptyMessage}
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

      <FinancialRefundDialog
        open={refundDialogOpen}
        onOpenChange={(open) => {
          setRefundDialogOpen(open);
          if (!open) setRecordToRefund(null);
        }}
        record={recordToRefund}
        onClose={() => {
          setRefundDialogOpen(false);
          setRecordToRefund(null);
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

      <FinancialPaymentHistoryDialog
        record={historyRecord}
        onClose={() => setHistoryRecord(null)}
      />
      <AlertDialog
        open={cancelDialogOpen}
        onOpenChange={(v) => {
          if (!v) {
            setCancelDialogOpen(false);
            setRecordToCancel(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {financialContent.tableRow.cancelCharge}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {recordToCancel?.students?.name
                ? `Cancelar cobrança de ${recordToCancel.students.name}? Esta ação não pode ser desfeita.`
                : "Cancelar esta cobrança? Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelCharge.isPending}>
              {financialContent.refundDialog.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelCharge.isPending}
              onClick={() => {
                if (!recordToCancel) return;
                cancelCharge.mutate(
                  { id: recordToCancel.id, status: "cancelado" },
                  {
                    onSuccess: () => {
                      setCancelDialogOpen(false);
                      setRecordToCancel(null);
                    },
                  }
                );
              }}
            >
              {financialContent.tableRow.cancelCharge}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
