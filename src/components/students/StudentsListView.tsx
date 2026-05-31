import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  StudentsFilters,
  type StudentsFiltersState,
  type StudentFilterPreset,
} from "@/components/filters/StudentsFilters";
import { defaultStudentsFilters } from "@/components/filters/filterDefaults";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyStudentsState } from "@/components/ui/contextual-empty-states";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { StudentsStatCards } from "@/components/students/StudentsStatCards";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import {
  useStudentsPaginated,
  Student,
  StudentInsert,
} from "@/hooks/useStudents";
import { useStudentFormSubmit } from "@/hooks/useStudentFormSubmit";
import { students as studentsContent, common } from "@/content";
import { useStudentsStats } from "@/hooks/useStudentsStats";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { StudentsTableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentsTableRow } from "@/components/students/StudentsTableRow";
import {
  COL as STUD_COL,
  TABLE_MIN_W as STUD_TABLE_MIN_W,
} from "@/components/students/StudentsTableRow.constants";
import { StudentDetailSheet } from "@/components/admin/StudentDetailSheet";
import { Teacher } from "@/hooks/useTeachers";
import { StudentPasswordDialog } from "@/components/students/StudentPasswordDialog";
import {
  StudentArchiveDialog,
  StudentHardDeleteDialog,
} from "@/components/students/StudentDeleteDialog";
import { StudentResetPasswordDialog } from "@/components/students/StudentResetPasswordDialog";
import { getStudentRowData } from "@/components/students/StudentsListView.helpers";

const COL = STUD_COL;
const TABLE_MIN_W = STUD_TABLE_MIN_W;

interface StudentsListViewProps {
  title: string;
  subtitle: string;
  showTeacherColumn?: boolean;
  showTeacherFilter?: boolean;
  autoTeacherId?: string | null;
  teachers: Teacher[];
  onNewStudentClick?: () => void;
  initialSearch?: string;
  initialFilterPreset?: StudentFilterPreset;
  showHardDelete?: boolean;
  showAnonymizedFilter?: boolean;
}

export function StudentsListView({
  title,
  subtitle,
  showTeacherColumn = true,
  showTeacherFilter = true,
  autoTeacherId = null,
  teachers,
  onNewStudentClick,
  initialSearch = "",
  initialFilterPreset = "all",
  showHardDelete = false,
  showAnonymizedFilter = false,
}: StudentsListViewProps) {
  const [filters, setFilters] = useState<StudentsFiltersState>({
    ...defaultStudentsFilters,
    status: "ativo",
    teacherId: "all",
    search: initialSearch,
    filterPreset: initialFilterPreset,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setSelectedStudent(null);
      setIsFormOpen(true);
      setSearchParams(
        (prev) => {
          prev.delete("action");
          return prev;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState<Student | null>(
    null
  );
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [studentToHardDelete, setStudentToHardDelete] =
    useState<Student | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [studentToResetPassword, setStudentToResetPassword] =
    useState<Student | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");

  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

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
  } = useStudentsPaginated({
    pageSize: 10,
    filters: {
      teacherId: autoTeacherId ?? filters.teacherId,
      status: filters.status,
      sortBy: filters.sortBy,
      search: filters.search || undefined,
    },
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: initialSearch }));
    setPage(0);
  }, [initialSearch, setPage]);

  const { data: studentsStats } = useStudentsStats(autoTeacherId);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const { submit: handleCreateOrUpdate, isPending: isSubmitting } =
    useStudentFormSubmit({
      selectedStudent,
      autoTeacherId,
      onSuccess: () => {
        setIsFormOpen(false);
        setSelectedStudent(null);
      },
      onCreated: ({ email, password }) => {
        setGeneratedEmail(email);
        setGeneratedPassword(password);
        setIsPasswordDialogOpen(true);
      },
    });

  const teacherMap = useMemo(() => {
    const map: Record<string, string> = {};
    teachers.forEach((t) => {
      if (t.id && t.name) map[t.id] = t.name;
    });
    return map;
  }, [teachers]);

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
      if (filters.filterPreset === "aniversariantes") {
        if (!student.birth_date) return false;
        const birthMonth =
          new Date(student.birth_date + "T00:00:00").getMonth() + 1;
        if (birthMonth !== currentMonth) return false;
      }

      const searchLower = filters.search.toLowerCase().trim();
      const searchDigits = searchLower.replace(/\D/g, "");
      return (
        !searchLower ||
        (student.name || "").toLowerCase().includes(searchLower) ||
        (student.email || "").toLowerCase().includes(searchLower) ||
        (student.phone || "").replace(/\D/g, "").includes(searchDigits)
      );
    });

    result = [...result].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      if (filters.sortBy === "name_asc") return nameA.localeCompare(nameB);
      if (filters.sortBy === "name_desc") return nameB.localeCompare(nameA);
      return 0;
    });

    return result;
  }, [students, filters, currentMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        {filters.status !== "anonimizados" && (
          <Button
            onClick={() => {
              setSelectedStudent(null);
              setIsFormOpen(true);
              onNewStudentClick?.();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {studentsContent.view.newButton}
          </Button>
        )}
      </div>

      {studentsStats && <StudentsStatCards stats={studentsStats} />}

      <StudentsFilters
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPage(0);
        }}
        onReset={() => {
          setFilters({
            ...defaultStudentsFilters,
            status: "ativo",
            teacherId: "all",
          });
          setPage(0);
        }}
        teachers={teachers}
        showTeacherFilter={showTeacherFilter}
        autoTeacherId={autoTeacherId}
        showAnonymizedFilter={showAnonymizedFilter}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{common.errors.generic}</p>
        </div>
      )}

      {!error && (
        <div
          className="rounded-lg border bg-card shadow-card overflow-hidden"
          ref={listTopRef}
        >
          <div className="overflow-x-auto">
            <Table style={{ minWidth: TABLE_MIN_W }}>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                    style={{ width: "1%" }}
                  >
                    {common.labels.status}
                  </TableHead>
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap tablet:sticky tablet:left-0 z-30 bg-muted"
                    style={{
                      width: COL.ALUNO,
                      minWidth: COL.ALUNO,
                      boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
                    }}
                  >
                    {studentsContent.view.title}
                  </TableHead>
                  {showTeacherColumn && (
                    <TableHead
                      className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                      style={{ width: COL.PROFESSOR, minWidth: COL.PROFESSOR }}
                    >
                      {common.labels.teacher}
                    </TableHead>
                  )}
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                    style={{ width: COL.VALOR_HORA, minWidth: COL.VALOR_HORA }}
                  >
                    {studentsContent.table.colHourlyRate}
                  </TableHead>
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                    style={{
                      width: COL.AULAS_SEMANA,
                      minWidth: COL.AULAS_SEMANA,
                    }}
                  >
                    {studentsContent.table.colClasses}
                  </TableHead>
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                    style={{
                      width: COL.TOTAL_MENSAL,
                      minWidth: COL.TOTAL_MENSAL,
                    }}
                  >
                    {studentsContent.table.colMonthlyTotal}
                  </TableHead>
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                    style={{ width: COL.DIA_PAGTO, minWidth: COL.DIA_PAGTO }}
                  >
                    {studentsContent.table.colPaymentDay}
                  </TableHead>
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                    style={{ width: COL.FINANCEIRO, minWidth: COL.FINANCEIRO }}
                  >
                    {studentsContent.table.colFinancial}
                  </TableHead>
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                    style={{
                      width: COL.ULTIMA_AULA,
                      minWidth: COL.ULTIMA_AULA,
                    }}
                  >
                    Última aula
                  </TableHead>
                  <TableHead
                    className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap"
                    style={{ width: COL.ACOES, minWidth: COL.ACOES }}
                  >
                    {common.labels.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {isLoading ? (
                  <StudentsTableSkeleton rows={10} />
                ) : (
                  filteredStudents.map((student) => {
                    const rowData = getStudentRowData(student, teacherMap);
                    return (
                      <StudentsTableRow
                        key={student.id}
                        student={student}
                        showTeacherColumn={showTeacherColumn}
                        teacherName={rowData.teacherName}
                        totalClasses={rowData.totalClasses}
                        monthlyTotal={rowData.monthlyTotal}
                        lastClassDateRaw={rowData.lastClassDateRaw}
                        daysWithoutClass={rowData.daysWithoutClass}
                        financialStatus={rowData.financialStatus}
                        onViewDetail={(id) => {
                          setDetailStudentId(id);
                          setDetailSheetOpen(true);
                        }}
                        onEdit={(s) => {
                          setSelectedStudent(s);
                          setIsFormOpen(true);
                        }}
                        onResetPassword={(s) => {
                          setStudentToResetPassword(s);
                          setResetPasswordDialogOpen(true);
                        }}
                        onArchive={(s) => {
                          setStudentToArchive(s);
                          setArchiveDialogOpen(true);
                        }}
                        onHardDelete={(s) => {
                          setStudentToHardDelete(s);
                          setHardDeleteDialogOpen(true);
                        }}
                        showHardDelete={showHardDelete}
                        isAnonymized={filters.status === "anonimizados"}
                      />
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 &&
            (students.length === 0 ? (
              <EmptyStudentsState
                onAction={() => {
                  setSelectedStudent(null);
                  setIsFormOpen(true);
                }}
                actionLabel={studentsContent.emptyState.actionLabel}
              />
            ) : (
              <EmptyState
                icon={Search}
                title={common.table.noResults}
                message={common.emptyStates.noResultsHint}
              />
            ))}

          <TablePaginationBar
            page={page}
            pageSize={10}
            totalCount={totalCount}
            hasMore={hasMore}
            isFetching={isFetching}
            onPageChange={setPage}
          />
        </div>
      )}

      <StudentDetailSheet
        studentId={detailStudentId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        teacherId={autoTeacherId}
      />

      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSubmit={handleCreateOrUpdate}
        isLoading={isSubmitting}
        autoTeacherId={autoTeacherId}
      />

      <StudentPasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) setGeneratedEmail("");
        }}
        password={generatedPassword}
        email={generatedEmail || undefined}
        source={generatedEmail ? "create" : "reset"}
      />

      <StudentResetPasswordDialog
        open={resetPasswordDialogOpen}
        onOpenChange={(open) => {
          setResetPasswordDialogOpen(open);
          if (!open) setStudentToResetPassword(null);
        }}
        student={studentToResetPassword}
        onSuccess={(password) => {
          setGeneratedPassword(password);
          setIsPasswordDialogOpen(true);
        }}
      />

      <StudentArchiveDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        student={studentToArchive}
        onClose={() => {
          setArchiveDialogOpen(false);
          setStudentToArchive(null);
        }}
      />

      <StudentHardDeleteDialog
        open={hardDeleteDialogOpen}
        onOpenChange={setHardDeleteDialogOpen}
        student={studentToHardDelete}
        onClose={() => {
          setHardDeleteDialogOpen(false);
          setStudentToHardDelete(null);
        }}
      />
    </div>
  );
}
