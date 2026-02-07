import { useState, useMemo, useRef, useEffect } from "react";
import { useTeachers } from "@/hooks/useTeachers";
import {
  OverviewFilters,
  type OverviewFiltersState,
} from "@/components/filters/OverviewFilters";
import { defaultOverviewFilters } from "@/components/filters/filterDefaults";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { useStudentsWithStatsPaginated } from "@/hooks/useStudentDetails";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { StudentDetailSheet } from "@/components/admin/StudentDetailSheet";
import { TableSkeleton } from "@/components/ui/table-skeleton";

const PAGE_SIZE = 10;

function StudentOverviewPage() {
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
  } = useStudentsWithStatsPaginated({ pageSize: PAGE_SIZE });
  const { data: teachers = [] } = useTeachers();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
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

      if (filters.teacherId !== "all" && student.teacher_id !== filters.teacherId) return false;

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
  }, [students, filters]);

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
          <h1 className="text-2xl font-semibold tracking-tight">
            Visão Geral dos Alunos
          </h1>
          <p className="text-muted-foreground mt-1">
            Estatísticas completas de todos os alunos
          </p>
        </div>

        {/* Filtros avançados */}
        <OverviewFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={() => {
            setFilters(defaultOverviewFilters);
            setPage(0);
          }}
          teachers={teachers}
          showTeacherFilter={true}
        />

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Erro ao carregar dados. Tente novamente.
            </p>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={10} columns={9} />
        ) : !error && (
          <>
            <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="whitespace-nowrap">Aluno</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Aulas</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Frequência</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Média</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Pago</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Pendente</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Atrasado</TableHead>
                      <TableHead className="text-center whitespace-nowrap">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const hasOverdue = student.stats.totalOverdue > 0;
                      const lowAttendance =
                        student.stats.attendanceRate !== null &&
                        student.stats.attendanceRate < 75;

                      return (
                        <TableRow
                          key={student.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-accent-foreground">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {student.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.email || student.phone || "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusBadge
                              variant={
                                student.status === "ativo" ? "success" : "default"
                              }
                            >
                              {student.status === "ativo" ? "Ativo" : "Inativo"}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-sm font-medium">
                              {student.stats.totalClasses}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {student.stats.attendanceRate !== null ? (
                                <>
                                  {lowAttendance ? (
                                    <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                                  ) : (
                                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      lowAttendance
                                        ? "text-rose-600"
                                        : "text-success"
                                    }`}
                                  >
                                    {student.stats.attendanceRate.toFixed(0)}%
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {student.stats.averageGrade !== null ? (
                              <span
                                className={`text-sm font-medium ${
                                  student.stats.averageGrade >= 7
                                    ? "text-success"
                                    : student.stats.averageGrade >= 5
                                    ? "text-amber-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {student.stats.averageGrade.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-success font-medium">
                              {formatCurrency(student.stats.totalPaid)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-amber-600 font-medium">
                              {formatCurrency(student.stats.totalPending)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`text-sm font-medium ${
                                hasOverdue ? "text-rose-600" : "text-muted-foreground"
                              }`}
                            >
                              {formatCurrency(student.stats.totalOverdue)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewStudent(student.id)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {students.length === 0
                    ? "Nenhum aluno cadastrado ainda"
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

export default StudentOverviewPage;
