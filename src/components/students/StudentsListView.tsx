import { useMemo, useState, useRef, useEffect } from "react";
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
  useCreateStudent,
  useUpdateStudent,
  Student,
  StudentInsert,
} from "@/hooks/useStudents";
import { useInviteStudent } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MSG_EMAIL } from "@/lib/duplicate-messages";
import { useStudentsStats } from "@/hooks/useStudentsStats";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { StudentsTableSkeleton } from "@/components/ui/table-skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentsTableRow } from "@/components/students/StudentsTableRow";
import { COL as STUD_COL, TABLE_MIN_W as STUD_TABLE_MIN_W } from "@/components/students/StudentsTableRow.constants";
import { StudentDetailSheet } from "@/components/admin/StudentDetailSheet";
import { Teacher } from "@/hooks/useTeachers";
import { StudentPasswordDialog } from "@/components/students/StudentPasswordDialog";
import { StudentArchiveDialog, StudentHardDeleteDialog } from "@/components/students/StudentDeleteDialog";
import { StudentResetPasswordDialog } from "@/components/students/StudentResetPasswordDialog";
import { getStudentRowData } from "@/components/students/StudentsListView.helpers";

// Aliases para constantes de layout
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
  /** Termo de busca vindo da URL (ex.: header global) */
  initialSearch?: string;
  /** Filtro inicial vindo da URL (ex.: dashboard aniversariantes) */
  initialFilterPreset?: StudentFilterPreset;
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

  // Dialog states
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [studentToHardDelete, setStudentToHardDelete] = useState<Student | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [studentToResetPassword, setStudentToResetPassword] = useState<Student | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Detail sheet
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

  const createStudent = useCreateStudent();
  const inviteStudent = useInviteStudent();
  const updateStudent = useUpdateStudent();

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
        const birthMonth = new Date(student.birth_date + "T00:00:00").getMonth() + 1;
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

  const handleCreateOrUpdate = (data: StudentInsert) => {
    const run = async () => {
      const dataWithTeacher = autoTeacherId ? { ...data, teacher_id: autoTeacherId } : data;
      const normalizedEmail = dataWithTeacher.email?.trim().toLowerCase();

      if (!selectedStudent && normalizedEmail) {
        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (profileError) {
          toast.error("Erro ao validar email. Tente novamente.");
          return;
        }
        if (existingProfile) {
          toast.error(MSG_EMAIL);
          return;
        }
      }

      if (selectedStudent) {
        updateStudent.mutate(
          { id: selectedStudent.id, ...dataWithTeacher },
          {
            onSuccess: () => {
              setIsFormOpen(false);
              setSelectedStudent(null);
            },
          }
        );
      } else {
        inviteStudent.mutate(dataWithTeacher as StudentInsert & { teacher_id?: string | null }, {
          onSuccess: () => {
            setIsFormOpen(false);
            toast.success("Aluno cadastrado! Um email com a senha foi enviado para o aluno.");
          },
        });
      }
    };

    void run();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setSelectedStudent(null);
            setIsFormOpen(true);
            onNewStudentClick?.();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      {studentsStats && <StudentsStatCards stats={studentsStats} />}

      {/* Filtros */}
      <StudentsFilters
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPage(0);
        }}
        onReset={() => {
          setFilters({ ...defaultStudentsFilters, status: "ativo", teacherId: "all" });
          setPage(0);
        }}
        teachers={teachers}
        showTeacherFilter={showTeacherFilter}
        autoTeacherId={autoTeacherId}
      />

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Erro ao carregar alunos. Tente novamente.</p>
        </div>
      )}

      {/* Tabela */}
      {!error && (
        <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
          <div className="overflow-x-auto">
            <Table style={{ minWidth: TABLE_MIN_W }}>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: "1%" }}>
                    Status
                  </TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted" style={{ width: COL.ALUNO, minWidth: COL.ALUNO, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>
                    Aluno
                  </TableHead>
                  {showTeacherColumn && (
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.PROFESSOR, minWidth: COL.PROFESSOR }}>
                      Professor
                    </TableHead>
                  )}
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.VALOR_HORA, minWidth: COL.VALOR_HORA }}>
                    Valor/hora
                  </TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.AULAS_SEMANA, minWidth: COL.AULAS_SEMANA }}>
                    Aulas
                  </TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.TOTAL_MENSAL, minWidth: COL.TOTAL_MENSAL }}>
                    Total mensal
                  </TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.DIA_PAGTO, minWidth: COL.DIA_PAGTO }}>
                    Dia pagto
                  </TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.FINANCEIRO, minWidth: COL.FINANCEIRO }}>
                    Financeiro
                  </TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.ULTIMA_AULA, minWidth: COL.ULTIMA_AULA }}>
                    Última aula
                  </TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.ACOES, minWidth: COL.ACOES }}>
                    Ações
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
                        showHardDelete={false}
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
                actionLabel="Adicionar primeiro aluno"
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Nenhum resultado"
                message="Ajuste os filtros acima ou limpe a busca"
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

      {/* Form Dialog */}
      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSubmit={handleCreateOrUpdate}
        isLoading={createStudent.isPending || inviteStudent.isPending || updateStudent.isPending}
        autoTeacherId={autoTeacherId}
      />

      {/* Senha gerada/redefinida */}
      <StudentPasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        password={generatedPassword}
        source="reset"
      />

      {/* Redefinir senha */}
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

      {/* Arquivar / Reativar */}
      <StudentArchiveDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        student={studentToArchive}
        onClose={() => {
          setArchiveDialogOpen(false);
          setStudentToArchive(null);
        }}
      />

      {/* Excluir definitivamente */}
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
