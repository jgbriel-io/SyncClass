import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
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
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  Student,
  StudentInsert,
} from "@/hooks/useStudents";
import { useCreateAuthUserForStudent } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFinancialRecords } from "@/hooks/useFinancialRecords";
import { useClassLogs } from "@/hooks/useClassLogs";
import { StudentDetailSheet } from "@/components/admin/StudentDetailSheet";

interface StudentsListViewProps {
  title: string;
  subtitle: string;
  showTeacherColumn?: boolean;
  showTeacherFilter?: boolean;
  autoTeacherId?: string | null;
  teachers: any[];
  onNewStudentClick?: () => void;
}

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

function formatCurrency(value: number | null | undefined): string {
  if (!value && value !== 0) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function StudentsListView({
  title,
  subtitle,
  showTeacherColumn = true,
  showTeacherFilter = true,
  autoTeacherId = null,
  teachers,
  onNewStudentClick,
}: StudentsListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ativo");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  const { data: students = [], isLoading, error } = useStudents();
  const { data: financialRecords = [] } = useFinancialRecords();
  const { data: classLogs = [] } = useClassLogs();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const createStudentUser = useCreateAuthUserForStudent();
  const queryClient = useQueryClient();

  const teacherMap = useMemo(() => {
    const map: Record<string, string> = {};
    teachers.forEach((t: any) => {
      if (t.id && t.name) {
        map[t.id] = t.name as string;
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    financialRecords.forEach((record: any) => {
      const studentId = record.student_id as string | undefined;
      if (!studentId) return;

      let actualStatus: InternalFinancialStatus;
      if (record.status === "pago") {
        actualStatus = "pago";
      } else {
        const dueDate = new Date(String(record.due_date) + "T00:00:00");
        actualStatus = dueDate < today ? "atrasado" : "pendente";
      }

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

    (classLogs as any[]).forEach((log) => {
      const studentId = log.student_id as string | undefined;
      const classDate = log.class_date as string | undefined;
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

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;

    let matchesTeacher = true;
    if (autoTeacherId) {
      matchesTeacher = ((student as any).teacher_id as string | null | undefined) === autoTeacherId;
    } else if (showTeacherFilter) {
      matchesTeacher =
        teacherFilter === "all" ||
        ((student as any).teacher_id as string | null | undefined) === teacherFilter;
    }

    return matchesSearch && matchesStatus && matchesTeacher;
  });

  const handleCreateOrUpdate = (data: StudentInsert) => {
    const run = async () => {
      // Auto-set teacher_id if provided
      const dataWithTeacher = autoTeacherId ? { ...data, teacher_id: autoTeacherId } : data;
      const normalizedEmail = (dataWithTeacher as any).email?.trim().toLowerCase();

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
          toast.error(
            "Já existe uma conta com esse email. Use a aba Usuários para vincular esse aluno à conta existente."
          );
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
        createStudent.mutate(dataWithTeacher, {
          onSuccess: (createdStudent) => {
            setIsFormOpen(false);

            if (createdStudent && createdStudent.email) {
              createStudentUser.mutate(
                {
                  studentId: createdStudent.id,
                  email: createdStudent.email,
                  fullName: createdStudent.name,
                },
                {
                  onSuccess: (result) => {
                    if (!result?.password) return;

                    const userId = result.user?.id as string | undefined;
                    const studentId = createdStudent.id;

                    // Update profiles cache optimistically so Users tab shows link immediately
                    try {
                      queryClient.setQueryData(["profiles", "all"], (old: any) => {
                        if (!old) return old;
                        return (old as any[]).map((p: any) =>
                          p.user_id === userId ? { ...p, student_id: studentId } : p
                        );
                      });
                      queryClient.setQueryData(["users"], (old: any) => {
                        if (!old) return old;
                        return (old as any[]).map((u: any) => {
                          if (u.id === userId) {
                            return {
                              ...u,
                              profile: {
                                ...(u.profile || {}),
                                student_id: studentId,
                              },
                            };
                          }
                          return u;
                        });
                      });
                    } catch (e) {
                      // ignore cache update failures
                    }

                    setGeneratedPassword(result.password);
                    setShowGeneratedPassword(false);
                    setPasswordCopied(false);
                    setIsPasswordDialogOpen(true);
                    toast.success("Aluno e conta de acesso cadastrados com sucesso.");
                  },
                }
              );
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

  const handleDeleteConfirm = () => {
    if (!studentToDelete) return;

    const isActive = studentToDelete.status === "ativo";

    if (isActive) {
      deleteStudent.mutate(studentToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setStudentToDelete(null);
        },
      });
    } else {
      updateStudent.mutate(
        { id: studentToDelete.id, status: "ativo" as any },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setStudentToDelete(null);
          },
        }
      );
    }
  };

  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          {showTeacherFilter && (
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os professores</SelectItem>
                {teachers.map((t: any) => (
                  <SelectItem key={t.id} value={t.id as string}>
                    {t.name as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

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
        <div className="rounded-lg border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Aluno
                  </th>
                  {showTeacherColumn && (
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                      Professor
                    </th>
                  )}
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                    Valor/hora
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell">
                    Aulas/semana
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell">
                    Total semanal
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell">
                    Dia pagto
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                    Financeiro
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Última aula
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => {
                  const lastUpdatedAt = (student as any).updated_at as string | null | undefined;
                  const hourlyRate = (student as any).hourly_rate as number | null | undefined;
                  const classesPerWeek = (student as any).classes_per_week as number | null | undefined;
                  const weeklyTotal =
                    hourlyRate != null && classesPerWeek != null
                      ? hourlyRate * classesPerWeek
                      : null;

                  const teacherName = (student as any).teacher_id
                    ? teacherMap[(student as any).teacher_id as string] || "—"
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
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <span className="text-sm text-muted-foreground truncate max-w-[160px] inline-block">
                            {teacherName}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(hourlyRate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden 2xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {classesPerWeek ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden 2xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(weeklyTotal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden 2xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {(student as any).pay_day ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        {financialStatus ? (
                          <StatusBadge variant={financialStatus.variant}>
                            {financialStatus.label}
                          </StatusBadge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem cobranças</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
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
                              onClick={() => openDeleteDialog(student)}
                            >
                              {student.status === "ativo" && (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              {student.status === "ativo" ? "Desativar" : "Reativar aluno"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredStudents.length === 0 && (
            <EmptyState
              icon={Search}
              title={students.length === 0 ? "Nenhum aluno cadastrado" : "Nenhum resultado"}
              message={students.length === 0
                ? "Clique no botão 'Novo Aluno' para adicionar o primeiro"
                : "Ajuste os filtros acima ou limpe a busca"}
            />
          )}
        </div>
      )}

      <StudentDetailSheet
        studentId={detailStudentId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />

      {/* Generated Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => setIsPasswordDialogOpen(open)}>
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
        isLoading={createStudent.isPending || updateStudent.isPending}
        autoTeacherId={autoTeacherId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {studentToDelete?.status === "ativo"
                ? "Confirmar desativação"
                : "Confirmar reativação"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {studentToDelete?.status === "ativo" ? (
                <>
                  Tem certeza que deseja desativar o aluno{" "}
                  <strong>{studentToDelete?.name}</strong>? Ele será removido da
                  lista de ativos, mas poderá ser visualizado em "Inativos".
                </>
              ) : (
                <>
                  Tem certeza que deseja reativar o aluno{" "}
                  <strong>{studentToDelete?.name}</strong>? Ele voltará para a
                  lista de ativos e terá o acesso reativado.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStudent.isPending || updateStudent.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteStudent.isPending || updateStudent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStudent.isPending || updateStudent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {studentToDelete?.status === "ativo"
                    ? "Desativando..."
                    : "Reativando..."}
                </>
              ) : studentToDelete?.status === "ativo" ? (
                "Desativar"
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
