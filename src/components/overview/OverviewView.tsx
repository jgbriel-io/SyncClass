import { useState, useMemo, useRef, useEffect } from "react";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import {
  OverviewFilters,
  type OverviewFiltersState,
} from "@/components/filters/OverviewFilters";
import { defaultOverviewFilters } from "@/components/filters/filterDefaults";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyStudentsState } from "@/components/ui/contextual-empty-states";
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "lucide-react";
import { useStudentsWithStatsPaginated } from "@/hooks/useStudentDetails";
import { useStudents } from "@/hooks/useStudents";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { StudentDetailSheet } from "@/components/admin/StudentDetailSheet";
import { OverviewTableSkeleton } from "@/components/ui/table-skeleton";
import { OverviewTableRow } from "@/components/overview/OverviewTableRow";
import {
  COL as OVERVIEW_COL,
  TABLE_MIN_W as OVERVIEW_TABLE_MIN_W,
} from "@/components/overview/OverviewTableRow.constants";
import {
  TABLE_HEAD_BASE,
  STICKY_HEADER,
  STICKY_SHADOW,
} from "@/lib/design-tokens/table-columns";
import { overview, common } from "@/content";

const PAGE_SIZE = 10;

interface OverviewViewProps {
  title?: string;
  subtitle?: string;
  showTeacherFilter?: boolean;
  autoTeacherId?: string | null;
}

export function OverviewView({
  title = overview.view.title,
  subtitle = overview.view.subtitle,
  showTeacherFilter = true,
  autoTeacherId = null,
}: OverviewViewProps) {
  const [filters, setFilters] = useState<OverviewFiltersState>(
    defaultOverviewFilters
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const listTopRef = useRef<HTMLDivElement>(null);

  const createdAfter = useMemo(() => {
    if (filters.period === "all") return null;
    const days = parseInt(filters.period, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return cutoff.toISOString();
  }, [filters.period]);

  const {
    data: students = [],
    isLoading,
    error,
    page,
    setPage,
    hasMore,
    totalCount,
    isFetching,
  } = useStudentsWithStatsPaginated({
    pageSize: PAGE_SIZE,
    teacherId: autoTeacherId,
    search: filters.search,
    status: filters.status,
    createdAfter,
  });

  const { data: teachers = [] } = useTeachers();
  const { data: allStudents = [] } = useStudents();
  const activeStudentsForFilter = allStudents.filter(
    (s) => s.status === "ativo"
  );

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
      if (filters.studentId !== "all" && student.id !== filters.studentId)
        return false;

      if (
        showTeacherFilter &&
        filters.teacherId !== "all" &&
        student.teacher_id !== filters.teacherId
      )
        return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();

      if (filters.sortBy === "name_asc") return nameA.localeCompare(nameB);
      if (filters.sortBy === "name_desc") return nameB.localeCompare(nameA);
      if (filters.sortBy === "recent") return createdB - createdA;
      if (filters.sortBy === "oldest") return createdA - createdB;
      return 0;
    });
    return result;
  }, [students, filters, showTeacherFilter]);

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSheetOpen(true);
  };

  const handleFiltersChange = (newFilters: OverviewFiltersState) => {
    setFilters(newFilters);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {/* Filtros avançados */}
      <OverviewFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={() => {
          setFilters(defaultOverviewFilters);
          setPage(0);
        }}
        teachers={showTeacherFilter ? teachers : []}
        students={activeStudentsForFilter}
        showTeacherFilter={showTeacherFilter}
      />

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{overview.errors.loadingError}</p>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg border bg-card shadow-card overflow-hidden"
        ref={listTopRef}
      >
        <div className="overflow-x-auto">
          <Table
            className="table-fixed"
            style={{ minWidth: OVERVIEW_TABLE_MIN_W }}
          >
            <TableHeader>
              <TableRow className="border-b bg-muted/50">
                <TableHead
                  className={`${TABLE_HEAD_BASE} ${STICKY_HEADER}`}
                  style={{
                    ...STICKY_SHADOW,
                    width: OVERVIEW_COL.ALUNO,
                    minWidth: OVERVIEW_COL.ALUNO,
                  }}
                >
                  {overview.table.student}
                </TableHead>
                <TableHead
                  className={TABLE_HEAD_BASE}
                  style={{
                    width: OVERVIEW_COL.ENTRADA,
                    minWidth: OVERVIEW_COL.ENTRADA,
                  }}
                >
                  {overview.table.entry}
                </TableHead>
                <TableHead
                  className={TABLE_HEAD_BASE}
                  style={{
                    width: OVERVIEW_COL.AULAS,
                    minWidth: OVERVIEW_COL.AULAS,
                  }}
                >
                  {overview.table.classes}
                </TableHead>
                <TableHead
                  className={TABLE_HEAD_BASE}
                  style={{
                    width: OVERVIEW_COL.FREQUENCIA,
                    minWidth: OVERVIEW_COL.FREQUENCIA,
                  }}
                >
                  {overview.table.frequency}
                </TableHead>
                <TableHead
                  className={TABLE_HEAD_BASE}
                  style={{
                    width: OVERVIEW_COL.MEDIA,
                    minWidth: OVERVIEW_COL.MEDIA,
                  }}
                >
                  {overview.table.average}
                </TableHead>
                <TableHead
                  className={TABLE_HEAD_BASE}
                  style={{
                    width: OVERVIEW_COL.PAGO,
                    minWidth: OVERVIEW_COL.PAGO,
                  }}
                >
                  {overview.table.paid}
                </TableHead>
                <TableHead
                  className={TABLE_HEAD_BASE}
                  style={{
                    width: OVERVIEW_COL.PENDENTE,
                    minWidth: OVERVIEW_COL.PENDENTE,
                  }}
                >
                  {overview.table.pending}
                </TableHead>
                <TableHead
                  className={TABLE_HEAD_BASE}
                  style={{
                    width: OVERVIEW_COL.ATRASADO,
                    minWidth: OVERVIEW_COL.ATRASADO,
                  }}
                >
                  {overview.table.overdue}
                </TableHead>
                <TableHead
                  className={TABLE_HEAD_BASE}
                  style={{
                    width: OVERVIEW_COL.ACOES,
                    minWidth: OVERVIEW_COL.ACOES,
                  }}
                >
                  {overview.table.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <OverviewTableSkeleton rows={10} />
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <td colSpan={10} className="p-0">
                    {students.length === 0 ? (
                      <EmptyStudentsState />
                    ) : (
                      <EmptyState
                        icon={Search}
                        title={common.table.noResults}
                        message={overview.messages.adjustFilters}
                      />
                    )}
                  </td>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <OverviewTableRow
                    key={student.id}
                    student={student}
                    onViewStudent={handleViewStudent}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePaginationBar
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={totalCount}
          hasMore={hasMore}
          isFetching={isFetching}
          onPageChange={setPage}
        />
      </div>

      {/* Detail Sheet */}
      <StudentDetailSheet
        studentId={selectedStudentId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
