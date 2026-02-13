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
import { useStudentsWithStatsPaginated } from "@/hooks/useStudentDetails";
import { useStudents } from "@/hooks/useStudents";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { StudentDetailSheet } from "@/components/admin/StudentDetailSheet";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { OverviewTableRow, COL as OVERVIEW_COL, TABLE_MIN_W as OVERVIEW_TABLE_MIN_W } from "@/components/overview/OverviewTableRow";

const PAGE_SIZE = 10;

// Helper function to get column styles
const getColumnStyle = (colWidth: string | number) => {
  if (colWidth === 'auto') {
    return { width: 'fit-content', minWidth: '60px', maxWidth: '120px' };
  }
  return { width: colWidth, minWidth: colWidth };
};

interface OverviewViewProps {
  title?: string;
  subtitle?: string;
  showTeacherFilter?: boolean;
  autoTeacherId?: string | null;
}

export function OverviewView({
  title = "Visão Geral dos Alunos",
  subtitle = "Estatísticas completas de todos os alunos",
  showTeacherFilter = true,
  autoTeacherId = null,
}: OverviewViewProps) {
  const [filters, setFilters] = useState<OverviewFiltersState>(defaultOverviewFilters);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const listTopRef = useRef<HTMLDivElement>(null);

  const {
    data: students = [],
    isLoading,
    error,
    page,
    setPage,
    hasMore,
    totalCount,
    isFetching,
  } = useStudentsWithStatsPaginated({ pageSize: PAGE_SIZE, teacherId: autoTeacherId });

  const { data: teachers = [] } = useTeachers();
  const { data: allStudents = [] } = useStudents();
  const activeStudentsForFilter = allStudents.filter((s) => s.status === "ativo");

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
      if (filters.studentId !== "all" && student.id !== filters.studentId) return false;

      const searchLower = filters.search.toLowerCase().trim();
      const searchDigits = searchLower.replace(/\D/g, "");
      const matchesSearch =
        !searchLower ||
        (student.name || "").toLowerCase().includes(searchLower) ||
        (student.email || "").toLowerCase().includes(searchLower) ||
        (student.cpf || "").replace(/\D/g, "").includes(searchDigits) ||
        (student.phone || "").replace(/\D/g, "").includes(searchDigits);
      if (!matchesSearch) return false;

      const matchesStatus = filters.status === "all" || student.status === filters.status;
      if (!matchesStatus) return false;

      if (showTeacherFilter && filters.teacherId !== "all" && student.teacher_id !== filters.teacherId) return false;

      if (filters.period !== "all") {
        const created = new Date(student.created_at || 0);
        const days = parseInt(filters.period, 10);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (created < cutoff) return false;
      }
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
          <p className="text-destructive">Erro ao carregar dados. Tente novamente.</p>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={9} />
      ) : (
        !error && (
          <>
            <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
              <div className="overflow-x-auto min-w-0">
                <Table style={{ minWidth: OVERVIEW_TABLE_MIN_W }}>
                  <TableHeader>
                    <TableRow className="border-b bg-muted/50">
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: '1%' }}>Status</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground uppercase tracking-wider sticky left-0 z-30 bg-muted" style={{ boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)', ...getColumnStyle(OVERVIEW_COL.ALUNO) }}>Aluno</TableHead>
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={getColumnStyle(OVERVIEW_COL.ENTRADA)}>Entrada</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground uppercase tracking-wider" style={getColumnStyle(OVERVIEW_COL.AULAS)}>Aulas</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground uppercase tracking-wider" style={getColumnStyle(OVERVIEW_COL.FREQUENCIA)}>Frequência</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground uppercase tracking-wider" style={getColumnStyle(OVERVIEW_COL.MEDIA)}>Média</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground uppercase tracking-wider" style={getColumnStyle(OVERVIEW_COL.PAGO)}>Pago</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground uppercase tracking-wider" style={getColumnStyle(OVERVIEW_COL.PENDENTE)}>Pendente</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground uppercase tracking-wider" style={getColumnStyle(OVERVIEW_COL.ATRASADO)}>Atrasado</TableHead>
                      <TableHead className="text-left font-medium text-muted-foreground uppercase tracking-wider" style={getColumnStyle(OVERVIEW_COL.ACOES)}>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <OverviewTableRow
                        key={student.id}
                        student={student}
                        onViewStudent={handleViewStudent}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {students.length === 0
                    ? showTeacherFilter
                      ? "Nenhum aluno cadastrado ainda"
                      : "Nenhum aluno vinculado a você ainda"
                    : "Nenhum aluno encontrado com esses filtros"}
                </div>
              )}
              <TablePaginationBar
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={totalCount}
                hasMore={hasMore}
                isFetching={isFetching}
                onPageChange={setPage}
              />
            </div>
          </>
        )
      )}

      {/* Detail Sheet */}
      <StudentDetailSheet
        studentId={selectedStudentId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
