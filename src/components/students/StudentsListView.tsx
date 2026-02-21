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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/formatters";
import { MSG_EMAIL } from "@/lib/duplicate-messages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Plus, Eye, EyeOff, Copy, Check, Users, UserCheck, UserX, TrendingUp, Loader2 } from "lucide-react";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import {
  useStudentsPaginated,
  useCreateStudent,
  useUpdateStudent,
  useHardDeleteStudent,
  Student,
  StudentInsert,
} from "@/hooks/useStudents";
import { useInviteStudent, useCreateAuthUserForStudent, useResetPassword } from "@/hooks/useUsers";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStudentsStats } from "@/hooks/useStudentsStats";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { StudentsTableSkeleton } from "@/components/ui/table-skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentsTableRow } from "@/components/students/StudentsTableRow";
import { COL as STUD_COL, TABLE_MIN_W as STUD_TABLE_MIN_W } from "@/components/students/StudentsTableRow.constants";
import { StudentDetailSheet } from "@/components/admin/StudentDetailSheet";
import { Teacher } from "@/hooks/useTeachers";

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

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

/** Using StudentsTableRow exports for layout constants */
const COL = STUD_COL;
const TABLE_MIN_W = STUD_TABLE_MIN_W;

/** Calcula dados derivados de uma linha (para evitar repetição no map) */
function getStudentRowData(
  student: Student & {
    total_classes_current_month?: number;
    total_amount_current_month?: number;
  },
  teacherMap: Record<string, string>
) {
  // Usar valores calculados pela view students_with_stats
  const totalClasses = student.total_classes_current_month ?? 0;
  const monthlyTotal = student.total_amount_current_month ?? 0;
  const teacherName = student.teacher_id ? teacherMap[student.teacher_id] || "—" : "—";
  
  return {
    student,
    teacherName,
    totalClasses,
    monthlyTotal,
    lastClassDateRaw: null,
    daysWithoutClass: null,
    financialStatus: null,
  };
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
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [studentToHardDelete, setStudentToHardDelete] = useState<Student | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [studentToResetPassword, setStudentToResetPassword] = useState<Student | null>(null);
  const [resetPasswordNew, setResetPasswordNew] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
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

  // ✅ Usando students_with_stats que calcula total de aulas e valores
  const { data: studentsStats } = useStudentsStats(autoTeacherId);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const createStudent = useCreateStudent();
  const inviteStudent = useInviteStudent();
  const updateStudent = useUpdateStudent();
  const hardDeleteStudent = useHardDeleteStudent();
  const createStudentUser = useCreateAuthUserForStudent();
  const teacherResetPassword = useResetPassword();

  const teacherMap = useMemo(() => {
    const map: Record<string, string> = {};
    teachers.forEach((t) => {
      if (t.id && t.name) {
        map[t.id] = t.name;
      }
    });
    return map;
  }, [teachers]);

  // Mês atual para filtro de aniversariantes
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  /* ❌ ANTIGO: Cálculos de status financeiro, última aula e total mensal no front (DEPRECATED - remover em 2026-03-01)
  ... código comentado ...
  */

  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
      // Filtro de aniversariantes (não está no banco)
      if (filters.filterPreset === "aniversariantes") {
        if (!student.birth_date) return false;
        const birthMonth = new Date(student.birth_date + "T00:00:00").getMonth() + 1;
        if (birthMonth !== currentMonth) return false;
      }

      // Busca por texto com dígitos (telefone)
      const searchLower = filters.search.toLowerCase().trim();
      const searchDigits = searchLower.replace(/\D/g, "");
      const matchesSearch =
        !searchLower ||
        (student.name || "").toLowerCase().includes(searchLower) ||
        (student.email || "").toLowerCase().includes(searchLower) ||
        (student.phone || "").replace(/\D/g, "").includes(searchDigits);

      if (!matchesSearch) return false;

      return true;
    });

    // Ordenação (não está no banco)
    result = [...result].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();

      if (filters.sortBy === "name_asc") return nameA.localeCompare(nameB);
      if (filters.sortBy === "name_desc") return nameB.localeCompare(nameA);
      // Ordenação por último pagamento não é mais suportada
      if (filters.sortBy === "last_payment_desc" || filters.sortBy === "last_payment_asc") {
        return nameA.localeCompare(nameB); // Fallback para ordenação por nome
      }
      return 0;
    });

    return result;
  }, [students, filters, currentMonth]);

  const handleCreateOrUpdate = (data: StudentInsert) => {
    const run = async () => {
      // Auto-set teacher_id if provided
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
        // Email é obrigatório, sempre usa inviteStudent
        inviteStudent.mutate(dataWithTeacher as StudentInsert & { teacher_id?: string | null }, {
          onSuccess: (result) => {
            setIsFormOpen(false);
            if (result?.password) {
              setGeneratedPassword(result.password);
              setShowGeneratedPassword(false);
              setPasswordCopied(false);
              setIsPasswordDialogOpen(true);
            }
          },
        });
      }
    };

    void run();
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (!studentToArchive) return;

    const isActive = studentToArchive.status === "ativo";

    if (isActive) {
      // Arquivar: muda status para inativo (preserva histórico, updateStudent sincroniza profile.active)
      updateStudent.mutate(
        { id: studentToArchive.id, status: "inativo" },
        {
          onSuccess: () => {
            setArchiveDialogOpen(false);
            setStudentToArchive(null);
          },
        }
      );
    } else {
      // Reativar aluno
      updateStudent.mutate(
        { id: studentToArchive.id, status: "ativo" },
        {
          onSuccess: () => {
            setArchiveDialogOpen(false);
            setStudentToArchive(null);
          },
        }
      );
    }
  };

  const openArchiveDialog = (student: Student) => {
    setStudentToArchive(student);
    setArchiveDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">{title}</h1>
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

      {/* Cards de estatísticas */}
      {studentsStats && (
        <div className="grid gap-4 grid-cols-1 laptop:grid-cols-4">
          <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight">{studentsStats.totalStudents}</p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Alunos Ativos</p>
                <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-success">{studentsStats.activeStudents}</p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-success/10">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Alunos Inativos</p>
                <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-muted-foreground">{studentsStats.inactiveStudents}</p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-muted">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Novos este Mês</p>
                <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-primary">{studentsStats.newStudentsThisMonth}</p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros avançados */}
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
          <p className="text-destructive">
            Erro ao carregar alunos. Tente novamente.
          </p>
        </div>
      )}

      {/* Table — horizontal scroll com sticky column "Aluno" */}
      {!error && (
        <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
          <div className="overflow-x-auto">
                <Table style={{ minWidth: TABLE_MIN_W }}>
                  <TableHeader>
                    <TableRow className="border-b bg-muted/50">
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: '1%' }}>Status</TableHead>
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted" style={{ width: COL.ALUNO, minWidth: COL.ALUNO, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>Aluno</TableHead>
                      {showTeacherColumn && (
                        <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.PROFESSOR, minWidth: COL.PROFESSOR }}>Professor</TableHead>
                      )}
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.VALOR_HORA, minWidth: COL.VALOR_HORA }}>Valor/hora</TableHead>
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.AULAS_SEMANA, minWidth: COL.AULAS_SEMANA }}>Aulas</TableHead>
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.TOTAL_MENSAL, minWidth: COL.TOTAL_MENSAL }}>Total mensal</TableHead>
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.DIA_PAGTO, minWidth: COL.DIA_PAGTO }}>Dia pagto</TableHead>
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.FINANCEIRO, minWidth: COL.FINANCEIRO }}>Financeiro</TableHead>
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.ULTIMA_AULA, minWidth: COL.ULTIMA_AULA }}>Última aula</TableHead>
                      <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: COL.ACOES, minWidth: COL.ACOES }}>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/40">
                    {isLoading ? (
                      <StudentsTableSkeleton rows={10} />
                    ) : (
                      filteredStudents.map((student) => {
                      // ✅ NOVO: Apenas passar student e teacherMap
                      const rowData = getStudentRowData(student, teacherMap);
                      
                      /* ❌ ANTIGO: Passar todos os maps calculados (DEPRECATED)
                      const rowData = getStudentRowData(
                        student,
                        teacherMap,
                        monthlyTotalFromChargesByStudent,
                        lastClassDateByStudent,
                        financialStatusByStudent
                      );
                      */
                      
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
                          onEdit={handleEdit}
                          onResetPassword={(s) => {
                            setStudentToResetPassword(s);
                            setResetPasswordNew("");
                            setResetPasswordConfirm("");
                            setResetPasswordDialogOpen(true);
                          }}
                          onArchive={openArchiveDialog}
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
          {filteredStudents.length === 0 && (
            students.length === 0 ? (
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
            )
          )}
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

      {/* Generated Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Senha criada para o aluno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Guarde esta senha com segurança. Ela não será exibida novamente.
            </p>

            <div className="space-y-2">
              <Label>Senha temporária</Label>
              <div className="relative">
                <Input
                  ref={passwordInputRef}
                  type={showGeneratedPassword ? "text" : "password"}
                  value={generatedPassword}
                  readOnly
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGeneratedPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showGeneratedPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between gap-4 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
onClick={() => {
                  if (!generatedPassword) return;
                  const onSuccess = () => {
                    setPasswordCopied(true);
                    setTimeout(() => setPasswordCopied(false), 2000);
                  };
                  const tryInputCopy = () => {
                    const input = passwordInputRef.current;
                    if (input) {
                      input.focus();
                      input.select();
                      input.setSelectionRange(0, generatedPassword.length);
                      if (document.execCommand("copy")) onSuccess();
                      else toast.error("Não foi possível copiar. Copie a senha manualmente.");
                    } else {
                      toast.error("Não foi possível copiar. Copie a senha manualmente.");
                    }
                  };
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(generatedPassword).then(onSuccess).catch(tryInputCopy);
                  } else {
                    tryInputCopy();
                  }
                }}
              >
                {passwordCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar senha
                  </>
                )}
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => setIsPasswordDialogOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir definitivamente o aluno{" "}
              <strong>{studentToHardDelete?.name}</strong>?
              <br />
              <br />
              <strong className="text-destructive">Atenção:</strong> Todo o histórico de aulas e
              cobranças deste aluno será <strong>permanentemente removido</strong>. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={hardDeleteStudent.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!studentToHardDelete) return;
                hardDeleteStudent.mutate(studentToHardDelete.id, {
                  onSuccess: () => {
                    setHardDeleteDialogOpen(false);
                    setStudentToHardDelete(null);
                  },
                });
              }}
              disabled={hardDeleteStudent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {hardDeleteStudent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir definitivamente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {studentToArchive?.status === "ativo"
                ? "Confirmar arquivamento"
                : "Confirmar reativação"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {studentToArchive?.status === "ativo" ? (
                <>
                  Tem certeza que deseja arquivar o aluno{" "}
                  <strong>{studentToArchive?.name}</strong>?
                  <br />
                  <br />
                  <strong>Importante:</strong> O histórico de aulas e cobranças será{" "}
                  <strong>preservado</strong>. O aluno apenas não aparecerá mais nas listagens ativas.
                </>
              ) : (
                <>
                  Tem certeza que deseja reativar o aluno{" "}
                  <strong>{studentToArchive?.name}</strong>? Ele voltará para a
                  lista de ativos e terá o acesso reativado.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStudent.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={updateStudent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updateStudent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {studentToArchive?.status === "ativo"
                    ? "Arquivando..."
                    : "Reativando..."}
                </>
              ) : studentToArchive?.status === "ativo" ? (
                "Arquivar"
              ) : (
                "Reativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Redefinir senha do aluno (professor) */}
      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={(open) => {
          setResetPasswordDialogOpen(open);
          if (!open) {
            setStudentToResetPassword(null);
            setResetPasswordNew("");
            setResetPasswordConfirm("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir senha do aluno</DialogTitle>
            {studentToResetPassword && (
              <DialogDescription>
                Nova senha para <strong>{studentToResetPassword.name}</strong>.
              </DialogDescription>
            )}
          </DialogHeader>
          {studentToResetPassword && (
            <>
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2 mb-4">
                <p className="text-xs font-medium text-muted-foreground">Requisitos da senha:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Mínimo de 8 caracteres</li>
                  <li>Pelo menos uma letra maiúscula (A-Z)</li>
                  <li>Pelo menos uma letra minúscula (a-z)</li>
                  <li>Pelo menos um número (0-9)</li>
                  <li>Pelo menos um caractere especial (!@#$%^&*)</li>
                </ul>
              </div>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="reset-password-new">Nova senha</Label>
                  <Input
                    id="reset-password-new"
                    type="password"
                    placeholder="••••••••"
                    value={resetPasswordNew}
                    onChange={(e) => setResetPasswordNew(e.target.value)}
                    minLength={8}
                    disabled={teacherResetPassword.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-password-confirm">Confirmar senha</Label>
                  <Input
                    id="reset-password-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={resetPasswordConfirm}
                    onChange={(e) => setResetPasswordConfirm(e.target.value)}
                    minLength={8}
                    disabled={teacherResetPassword.isPending}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Gerar senha forte com todos os requisitos
                    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
                    const lower = "abcdefghijkmnpqrstuvwxyz";
                    const numbers = "23456789";
                    const special = "!@#$%^&*";
                    
                    let p = "";
                    // Garantir pelo menos um de cada tipo
                    p += upper.charAt(Math.floor(Math.random() * upper.length));
                    p += lower.charAt(Math.floor(Math.random() * lower.length));
                    p += numbers.charAt(Math.floor(Math.random() * numbers.length));
                    p += special.charAt(Math.floor(Math.random() * special.length));
                    
                    // Completar com caracteres aleatórios
                    const allChars = upper + lower + numbers + special;
                    for (let i = 4; i < 12; i++) {
                      p += allChars.charAt(Math.floor(Math.random() * allChars.length));
                    }
                    
                    // Embaralhar
                    p = p.split('').sort(() => Math.random() - 0.5).join('');
                    
                    setResetPasswordNew(p);
                    setResetPasswordConfirm(p);
                  }}
                >
                  Gerar senha
                </Button>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResetPasswordDialogOpen(false);
                    setStudentToResetPassword(null);
                    setResetPasswordNew("");
                    setResetPasswordConfirm("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={
                    teacherResetPassword.isPending ||
                    resetPasswordNew.length < 8 ||
                    resetPasswordNew !== resetPasswordConfirm ||
                    !/[A-Z]/.test(resetPasswordNew) ||
                    !/[a-z]/.test(resetPasswordNew) ||
                    !/[0-9]/.test(resetPasswordNew) ||
                    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(resetPasswordNew)
                  }
                  onClick={() => {
                    // Validação completa
                    if (resetPasswordNew.length < 8) {
                      toast.error("A senha deve ter no mínimo 8 caracteres.");
                      return;
                    }
                    if (!/[A-Z]/.test(resetPasswordNew)) {
                      toast.error("A senha deve conter pelo menos uma letra maiúscula.");
                      return;
                    }
                    if (!/[a-z]/.test(resetPasswordNew)) {
                      toast.error("A senha deve conter pelo menos uma letra minúscula.");
                      return;
                    }
                    if (!/[0-9]/.test(resetPasswordNew)) {
                      toast.error("A senha deve conter pelo menos um número.");
                      return;
                    }
                    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(resetPasswordNew)) {
                      toast.error("A senha deve conter pelo menos um caractere especial.");
                      return;
                    }
                    if (resetPasswordNew !== resetPasswordConfirm) {
                      toast.error("As senhas não coincidem.");
                      return;
                    }
                    
                    teacherResetPassword.mutate(
                      { studentId: studentToResetPassword.id, password: resetPasswordNew },
                      {
                        onSuccess: () => {
                          const passwordToShow = resetPasswordNew;
                          setResetPasswordDialogOpen(false);
                          setStudentToResetPassword(null);
                          setResetPasswordNew("");
                          setResetPasswordConfirm("");
                          setGeneratedPassword(passwordToShow);
                          setShowGeneratedPassword(false);
                          setPasswordCopied(false);
                          setIsPasswordDialogOpen(true);
                        },
                      }
                    );
                  }}
                >
                  {teacherResetPassword.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
