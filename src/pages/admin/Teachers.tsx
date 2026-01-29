import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TeacherFormDialog } from "@/components/teachers/TeacherFormDialog";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  Teacher,
} from "@/hooks/useTeachers";
import { useCreateAuthUserForTeacher } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ativo");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { data: teachers = [], isLoading, error } = useTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const createTeacherUser = useCreateAuthUserForTeacher();

  const filteredTeachers = teachers.filter((teacher) => {
    const name = (teacher.name ?? "").toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());

    const status = ((teacher as any).status as string | null) ?? "ativo";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateOrUpdate = (data: any) => {
    const run = async () => {
      const normalizedEmail = (data as any).email?.trim().toLowerCase();

      if (!selectedTeacher && normalizedEmail) {
        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Error checking email uniqueness for teacher:",
            profileError
          );
          toast.error("Erro ao validar email. Tente novamente.");
          return;
        }

        if (existingProfile) {
          toast.error(
            "Já existe uma conta com esse email. Use a aba Usuários para vincular esse professor à conta existente."
          );
          return;
        }
      }

      if (selectedTeacher) {
        updateTeacher.mutate(
          { id: selectedTeacher.id, ...data },
          {
            onSuccess: () => {
              setIsFormOpen(false);
              setSelectedTeacher(null);
            },
          }
        );
      } else {
        createTeacher.mutate(data, {
          onSuccess: (createdTeacher) => {
            setIsFormOpen(false);

            if (createdTeacher && createdTeacher.email) {
              createTeacherUser.mutate(
                {
                  teacherId: createdTeacher.id,
                  email: createdTeacher.email,
                  fullName: createdTeacher.name,
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

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleStatusChangeConfirm = () => {
    if (!teacherToDelete) return;

    const status = ((teacherToDelete as any).status as string | null) ?? "ativo";
    const isActive = status === "ativo";

    if (isActive) {
      // Soft deactivate (status -> inativo)
      deleteTeacher.mutate(teacherToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setTeacherToDelete(null);
        },
      });
    } else {
      // Reactivate (status -> ativo)
      updateTeacher.mutate(
        { id: teacherToDelete.id, status: "ativo" as any },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setTeacherToDelete(null);
          },
        }
      );
    }
  };

  return (
    <AdminLayout>
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Professores</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie os professores do sistema
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedTeacher(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Professor
            </Button>
          </div>

          {/* Filtros */}
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

          {/* Table */}
          <div className="rounded-lg border bg-card shadow-card overflow-hidden">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">
                  Nome
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider">
                  Email
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider">
                  Telefone
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => {
                  const status =
                    ((teacher as any).status as string | null) ?? "ativo";
                  const lastUpdatedAt = (teacher as any).updated_at as string | null | undefined;

                  return (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {teacher.name}
                          </span>
                          {lastUpdatedAt && (
                            <span className="text-[11px] text-muted-foreground mt-0.5">
                              {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{teacher.email || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{teacher.phone || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          variant={
                            status === "inativo" ? "default" : "success"
                          }
                        >
                          {status === "inativo" ? "Inativo" : "Ativo"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(teacher)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={
                                status === "ativo"
                                  ? "text-destructive focus:text-destructive"
                                  : "focus:text-primary"
                              }
                              onClick={() => {
                                setTeacherToDelete(teacher);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              {status === "ativo" && (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              {status === "ativo" ? "Desativar" : "Reativar professor"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredTeachers.length === 0 && (
              <EmptyState
                icon={Search}
                title={teachers.length === 0 ? "Nenhum professor cadastrado" : "Nenhum resultado"}
                message={teachers.length === 0
                  ? "Clique no botão 'Novo Professor' para adicionar o primeiro"
                  : "Ajuste os filtros acima ou limpe a busca"}
              />
            )}
          </div>
        </div>

        {/* Formulário de cadastro/edição */}
        <TeacherFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelectedTeacher(null);
          }}
          teacher={selectedTeacher}
          onSubmit={handleCreateOrUpdate}
          isLoading={createTeacher.isPending || updateTeacher.isPending}
        />

        {/* Modal de senha gerada para professor */}
        <Dialog
          open={isPasswordDialogOpen}
          onOpenChange={(open) => {
            setIsPasswordDialogOpen(open);
            if (!open && generatedPassword) {
              toast.success("Conta criada para o professor.");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Senha criada para o professor</DialogTitle>
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

        {/* Modal de confirmação de status (desativar/reativar) */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {(((teacherToDelete as any)?.status as string | null) ??
                "ativo") === "ativo"
                  ? "Confirmar desativação"
                  : "Confirmar reativação"}
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-muted-foreground">
              {(((teacherToDelete as any)?.status as string | null) ??
              "ativo") === "ativo" ? (
                <>
                  Tem certeza que deseja desativar o professor{" "}
                  <strong>{teacherToDelete?.name}</strong>? Ele será removido da
                  lista de ativos, mas poderá ser visualizado em "Inativos".
                </>
              ) : (
                <>
                  Tem certeza que deseja reativar o professor{" "}
                  <strong>{teacherToDelete?.name}</strong>? Ele voltará para a
                  lista de ativos e terá o acesso reativado.
                </>
              )}
            </p>
            <DialogFooter className="mt-4">
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteTeacher.isPending || updateTeacher.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleStatusChangeConfirm}
                disabled={deleteTeacher.isPending || updateTeacher.isPending}
              >
                {deleteTeacher.isPending || updateTeacher.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {(((teacherToDelete as any)?.status as string | null) ??
                    "ativo") === "ativo"
                      ? "Desativando..."
                      : "Reativando..."}
                  </>
                ) : (((teacherToDelete as any)?.status as string | null) ??
                    "ativo") === "ativo" ? (
                  "Desativar"
                ) : (
                  "Reativar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AdminLayout>
  );
}
