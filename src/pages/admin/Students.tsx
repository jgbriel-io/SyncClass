import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
import { Search, Plus, MoreHorizontal, Phone, Mail, Pencil, Trash2, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";
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
import { toast } from "sonner";

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

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ativo");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { data: students = [], isLoading, error } = useStudents();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const createStudentUser = useCreateAuthUserForStudent();

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrUpdate = (data: StudentInsert) => {
    const run = async () => {
      const normalizedEmail = (data as any).email?.trim().toLowerCase();

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
          { id: selectedStudent.id, ...data },
          {
            onSuccess: () => {
              setIsFormOpen(false);
              setSelectedStudent(null);
            },
          }
        );
      } else {
        createStudent.mutate(data, {
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
                    if (result?.password) {
                      setGeneratedPassword(result.password);
                      setShowGeneratedPassword(false);
                      setPasswordCopied(false);
                      setIsPasswordDialogOpen(true);
                    }
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
      // Soft deactivate (status -> inativo)
      deleteStudent.mutate(studentToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setStudentToDelete(null);
        },
      });
    } else {
      // Reactivate (status -> ativo)
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Alunos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os alunos cadastrados
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedStudent(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                      Contato
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                      Origem
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                      Cidade
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                      Valor/hora
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell">
                      Aulas/semana
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 hidden 2xl:table-cell">
                      Dia pagto
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((student) => (
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
                            <p className="font-medium text-sm truncate">
                              {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.cpf || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[180px]">
                              {student.email || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {student.phone || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {student.origin
                            ? originLabels[student.origin] || student.origin
                            : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {student.city || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency((student as any).hourly_rate as number | null)}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden 2xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {(student as any).classes_per_week ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden 2xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {(student as any).pay_day ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          variant={
                            student.status === "ativo" ? "success" : "default"
                          }
                        >
                          {student.status === "ativo" ? "Ativo" : "Inativo"}
                        </StatusBadge>
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
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {students.length === 0
                  ? "Nenhum aluno cadastrado ainda"
                  : "Nenhum aluno encontrado com esses filtros"}
              </div>
            )}
          </div>
        )}

        {/* Generated Password Dialog for student account */}
        <Dialog
          open={isPasswordDialogOpen}
          onOpenChange={(open) => {
            setIsPasswordDialogOpen(open);
            if (!open && generatedPassword) {
              toast.success("Conta criada para o aluno.");
            }
          }}
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
          isLoading={createStudent.isPending || updateStudent.isPending}
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
    </AdminLayout>
  );
}
