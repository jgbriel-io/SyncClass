import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { useStudentsWithStats } from "@/hooks/useStudentDetails";
import { StudentDetailSheet } from "@/components/admin/StudentDetailSheet";
import { useClassLogs } from "@/hooks/useClassLogs";
import { useFinancialRecords } from "@/hooks/useFinancialRecords";
import { TableSkeleton } from "@/components/ui/table-skeleton";

const ITEMS_PER_PAGE = 10;

function StudentOverviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: students = [], isLoading, error } = useStudentsWithStats();
  const { data: classLogs = [] } = useClassLogs();
  const { data: financialRecords = [] } = useFinancialRecords();

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSheetOpen(true);
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Visão Geral dos Alunos
          </h1>
          <p className="text-muted-foreground mt-1">
            Planilha completa com todos os dados dos alunos
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            <div className="rounded-lg border bg-card shadow-card overflow-hidden">
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
                    {paginatedStudents.map((student) => {
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            {/* Results info */}
            <p className="text-sm text-muted-foreground text-center">
              Mostrando {paginatedStudents.length} de {filteredStudents.length}{" "}
              alunos
            </p>

            {/* Planilha mensal similar à visão do professor */}
            <div className="mt-8 border rounded-lg overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Aluno</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Cidade</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Valor/hora</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Aulas/semana</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Aulas/mês</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Prev. mensal</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Dia pagamento</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Status pagto (mês)</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Aulas devidas (mês)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const hourlyRate = student.hourly_rate;
                    const classesPerWeek = student.classes_per_week;
                    const payDay = student.pay_day;
                    const city = student.city;

                    const totalMonthlyClasses = classesPerWeek ? classesPerWeek * 4 : 0;
                    const expectedMonthlyAmount =
                      hourlyRate && totalMonthlyClasses
                        ? hourlyRate * totalMonthlyClasses
                        : 0;

                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);

                    const classesThisMonth = classLogs.filter(
                      (log) =>
                        log.student_id === student.id &&
                        new Date(log.class_date + "T00:00:00") >= monthStart &&
                        new Date(log.class_date + "T00:00:00") <= monthEnd
                    ).length;

                    const classesOwed = Math.max(
                      (totalMonthlyClasses || 0) - classesThisMonth,
                      0
                    );

                    const recordsThisMonth = financialRecords.filter(
                      (rec) =>
                        rec.student_id === student.id &&
                        new Date(rec.due_date + "T00:00:00") >= monthStart &&
                        new Date(rec.due_date + "T00:00:00") <= monthEnd
                    );

                    const lastRecord =
                      recordsThisMonth.length > 0
                        ? recordsThisMonth[recordsThisMonth.length - 1]
                        : null;

                    const paymentStatusLabel = lastRecord
                      ? lastRecord.status === "pago"
                        ? "Pago"
                        : lastRecord.status === "atrasado"
                        ? "Atrasado"
                        : "Pendente"
                      : "—";

                    return (
                      <tr key={student.id} className="border-b last:border-0">
                        <td className="px-4 py-2 whitespace-nowrap">{student.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{city || "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {hourlyRate
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(hourlyRate)
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {classesPerWeek ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {totalMonthlyClasses || "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {expectedMonthlyAmount
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(expectedMonthlyAmount)
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {payDay ?? "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {paymentStatusLabel}
                        </td>
                        <td className="px-4 py-2 text-center">{classesOwed}</td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        Nenhum aluno encontrado para esta planilha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
    </AdminLayout>
  );
}

export default StudentOverviewPage;
