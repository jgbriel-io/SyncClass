import { useMemo, useState, useRef, useEffect } from "react";
import {
  StudentsFilters,
  type StudentsFiltersState,
} from "@/components/filters/StudentsFilters";
import { defaultStudentsFilters } from "@/components/filters/filterDefaults";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyStudentsState } from "@/components/ui/contextual-empty-states";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/formatters";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import { MSG_EMAIL } from "@/lib/duplicate-messages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import {
  useStudentsPaginated,
  useCreateStudent,
  useUpdateStudent,
  useSoftDeleteStudent,
  Student,
  StudentInsert,
} from "@/hooks/useStudents";
import { useCreateAuthUserForStudent, useInviteStudent } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFinancialRecordsByStudentIds, FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";
import { useClassLogsByStudentIds } from "@/hooks/useClassLogs";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
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
}

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

export function StudentsListView({
  title,
  subtitle,
  showTeacherColumn = true,
  showTeacherFilter = true,
  autoTeacherId = null,
  teachers,
  onNewStudentClick,
  initialSearch = "",
}: StudentsListViewProps) {
  const [filters, setFilters] = useState<StudentsFiltersState>({
    ...defaultStudentsFilters,
    status: "ativo",
    teacherId: "all",
    search: initialSearch,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: initialSearch }));
    setPage(0);
  }, [initialSearch, setPage]);

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
    pageSize: 20,
    filters: {
      teacherId: filters.teacherId,
      status: filters.status,
      sortBy: filters.sortBy,
    },
  });
  const studentIds = useMemo(() => students.map((s) => s.id), [students]);
  const { data: financialRecords = [] } = useFinancialRecordsByStudentIds(studentIds);
  const { data: classLogs = [] } = useClassLogsByStudentIds(studentIds);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const createStudent = useCreateStudent();
  const inviteStudent = useInviteStudent();
  const updateStudent = useUpdateStudent();
  const softDeleteStudent = useSoftDeleteStudent();
  const createStudentUser = useCreateAuthUserForStudent();

  const teacherMap = useMemo(() => {
    const map: Record<string, string> = {};
    teachers.forEach((t) => {
      if (t.id && t.name) {
        map[t.id] = t.name;
      }
    });
    return map;
  }, [teachers]);

  type InternalFinancialStatus = "none" | "pago" | "pendente" | "atrasado";

  const financialStatusByStudent = useMemo(() => {
    const statusMap: Record<
      string,
      { status: InternalFinancialStatus; label: string; variant: "default" | "success" | "warning" | "destructive" }
    > = {};

    const getPriority = (status: InternalFinancialStatus): number => {
      switch (status) {
        case "atrasado":
          return 3;
        case "pendente":
          return 2;
        case "pago":
          return 1;
        default:
          return 0;
      }
    };

    financialRecords.forEach((record: FinancialRecordWithRelations) => {
      const studentId = record.student_id;
      if (!studentId) return;

      const actualStatus = getFinancialActualStatus(record) as InternalFinancialStatus;

      const current = statusMap[studentId]?.status ?? "none";
      if (getPriority(actualStatus) <= getPriority(current)) {
        return;
      }

      let label = "Sem cobranças";
      let variant: "default" | "success" | "warning" | "destructive" = "default";
      if (actualStatus === "pago") {
        label = "Em dia";
        variant = "success";
      } else if (actualStatus === "pendente") {
        label = "Pendente";
        variant = "warning";
      } else if (actualStatus === "atrasado") {
        label = "Em atraso";
        variant = "destructive";
      }

      statusMap[studentId] = { status: actualStatus, label, variant };
    });

    return statusMap;
  }, [financialRecords]);

  const lastClassDateByStudent = useMemo(() => {
    const map: Record<string, string> = {};

    classLogs.forEach((log) => {
      const studentId = log.student_id;
      const classDate = log.class_date;
      if (!studentId || !classDate || !log.attendance) return;

      const current = map[studentId];
      if (!current) {
        map[studentId] = classDate;
        return;
      }

      const currentDate = new Date(current + "T00:00:00");
      const newDate = new Date(classDate + "T00:00:00");
      if (newDate > currentDate) {
        map[studentId] = classDate;
      }
    });

    return map;
  }, [classLogs]);

  const lastPaymentDateByStudent = useMemo(() => {
    const map: Record<string, string> = {};
    financialRecords.forEach((record: FinancialRecordWithRelations) => {
      if (record.status !== "pago" || !record.paid_at || !record.student_id) return;
      const current = map[record.student_id];
      if (!current) {
        map[record.student_id] = record.paid_at;
        return;
      }
      if (new Date(record.paid_at) > new Date(current)) {
        map[record.student_id] = record.paid_at;
      }
    });
    return map;
  }, [financialRecords]);

  const filteredStudents = useMemo(() => {
    let result = students.filter((student) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        !searchLower ||
        (student.name || "").toLowerCase().includes(searchLower) ||
        (student.cpf || "").replace(/\D/g, "").includes(searchLower.replace(/\D/g, ""));

      if (!matchesSearch) return false;

      const matchesStatus = filters.status === "all" || student.status === filters.status;
      if (!matchesStatus) return false;

      let matchesTeacher = true;
      if (autoTeacherId) {
        matchesTeacher = student.teacher_id === autoTeacherId;
      } else if (showTeacherFilter) {
        matchesTeacher = filters.teacherId === "all" || student.teacher_id === filters.teacherId;
      }
      if (!matchesTeacher) return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      const lastPayA = lastPaymentDateByStudent[a.id] || "";
      const lastPayB = lastPaymentDateByStudent[b.id] || "";

      if (filters.sortBy === "name_asc") return nameA.localeCompare(nameB);
      if (filters.sortBy === "name_desc") return nameB.localeCompare(nameA);
      if (filters.sortBy === "last_payment_desc") return lastPayB.localeCompare(lastPayA);
      if (filters.sortBy === "last_payment_asc") return lastPayA.localeCompare(lastPayB);
      return 0;
    });

    return result;
  }, [students, filters, autoTeacherId, showTeacherFilter, lastPaymentDateByStudent]);

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
          console.error("Error checking email uniqueness for student:", profileError);
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
        if (normalizedEmail) {
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
        } else {
          createStudent.mutate(dataWithTeacher, {
            onSuccess: () => setIsFormOpen(false),
          });
        }
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
      // Soft delete: preserva histórico de aulas e cobranças
      softDeleteStudent.mutate(studentToArchive.id, {
        onSuccess: () => {
          setArchiveDialogOpen(false);
          setStudentToArchive(null);
        },
      });
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
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
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

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            Erro ao carregar alunos. Tente novamente.
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Aluno
                  </th>
                  {showTeacherColumn && (
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell whitespace-nowrap">
                      Professor
                    </th>
                  )}
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell whitespace-nowrap">
                    Valor/hora
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell whitespace-nowrap">
                    Aulas/semana
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell whitespace-nowrap">
                    Total mensal
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell whitespace-nowrap">
                    Dia pagto
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell whitespace-nowrap">
                    Financeiro
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Última aula
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => {
                  const lastUpdatedAt = student.updated_at;
                  const hourlyRate = student.hourly_rate;
                  const classesPerWeek = student.classes_per_week;
                  const monthlyTotal =
                    hourlyRate != null && classesPerWeek != null
                      ? hourlyRate * classesPerWeek * 4
                      : null;

                  const teacherName = student.teacher_id
                    ? teacherMap[student.teacher_id] || "—"
                    : "—";

                  const lastClassDateRaw = lastClassDateByStudent[student.id];
                  const daysWithoutClass = lastClassDateRaw
                    ? (() => {
                        const last = new Date(lastClassDateRaw + "T00:00:00");
                        const today = new Date();
                        last.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        const diffMs = today.getTime() - last.getTime();
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        return diffDays < 0 ? 0 : diffDays;
                      })()
                    : null;
                  const financialStatus = financialStatusByStudent[student.id];

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-accent-foreground">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {student.name}
                              </p>
                              <StatusBadge
                                variant={
                                  student.status === "ativo" ? "success" : "default"
                                }
                              >
                                {student.status === "ativo" ? "Ativo" : "Inativo"}
                              </StatusBadge>
                            </div>
                            {lastUpdatedAt && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                              </p>
                            )}
                            <div className="mt-1">
                              <Button
                                variant="link"
                                size="sm"
                                className="px-0 h-5 text-xs"
                                onClick={() => {
                                  setDetailStudentId(student.id);
                                  setDetailSheetOpen(true);
                                }}
                              >
                                Ver detalhes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                      {showTeacherColumn && (
                        <td className="px-6 py-4 hidden xl:table-cell whitespace-nowrap">
                          <span className="text-sm text-muted-foreground">
                            {teacherName}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 hidden xl:table-cell whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {hourlyRate != null ? formatCurrency(hourlyRate) : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden 2xl:table-cell whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {classesPerWeek ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden 2xl:table-cell whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {monthlyTotal != null ? formatCurrency(monthlyTotal) : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden 2xl:table-cell whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {student.pay_day ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell whitespace-nowrap">
                        {financialStatus ? (
                          <StatusBadge variant={financialStatus.variant}>
                            {financialStatus.label}
                          </StatusBadge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem cobranças</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-sm text-muted-foreground block">
                            {lastClassDateRaw
                              ? format(new Date(lastClassDateRaw + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })
                              : "—"}
                          </span>
                          {daysWithoutClass !== null && (
                            <span className="text-[11px] text-muted-foreground block">
                              {daysWithoutClass} dia{daysWithoutClass === 1 ? "" : "s"} sem aula
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDetailStudentId(student.id);
                              setDetailSheetOpen(true);
                            }}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={
                                student.status === "ativo"
                                  ? "text-destructive focus:text-destructive"
                                  : "focus:text-primary"
                              }
                              onClick={() => openArchiveDialog(student)}
                            >
                              {student.status === "ativo" && (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              {student.status === "ativo" ? "Arquivar" : "Reativar aluno"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            pageSize={20}
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

            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  if (!generatedPassword) return;
                  try {
                    await navigator.clipboard.writeText(generatedPassword);
                    setPasswordCopied(true);
                    setTimeout(() => setPasswordCopied(false), 2000);
                  } catch (err) {
                    console.error("Erro ao copiar senha: ", err);
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
            <AlertDialogCancel disabled={softDeleteStudent.isPending || updateStudent.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={softDeleteStudent.isPending || updateStudent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {softDeleteStudent.isPending || updateStudent.isPending ? (
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
    </div>
  );
}
