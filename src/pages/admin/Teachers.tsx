import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  TeachersFilters,
  type TeachersFiltersState,
} from "@/components/filters/TeachersFilters";
import { defaultTeachersFilters } from "@/components/filters/filterDefaults";
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
import { MSG_EMAIL } from "@/lib/duplicate-messages";
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
  useTeachers,
  useTeachersPaginated,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  useHardDeleteTeacher,
  Teacher,
  TeacherInsert,
} from "@/hooks/useTeachers";
import { useCreateAuthUserForTeacher, useInviteTeacher } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";

export default function TeachersPage() {
  const [filters, setFilters] = useState<TeachersFiltersState>({
    ...defaultTeachersFilters,
    status: "ativo",
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [teacherToHardDelete, setTeacherToHardDelete] = useState<Teacher | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const listTopRef = useRef<HTMLDivElement>(null);
  const { data: allTeachers = [] } = useTeachers();
  const {
    data: teachers = [],
    isLoading,
    error,
    page,
    setPage,
    hasMore,
    totalCount,
    isFetching,
  } = useTeachersPaginated({
    pageSize: 20,
    filters: { status: filters.status, sortBy: filters.sortBy },
  });
  const createTeacher = useCreateTeacher();
  const inviteTeacher = useInviteTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const hardDeleteTeacher = useHardDeleteTeacher();
  const createTeacherUser = useCreateAuthUserForTeacher();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const specializations = useMemo(() => {
    const set = new Set<string>();
    allTeachers.forEach((t) => {
      const s = (t as Teacher & { specialization?: string | null }).specialization;
      if (s?.trim()) set.add(s.trim());
    });
    return Array.from(set).sort();
  }, [allTeachers]);

  const filteredTeachers = useMemo(() => {
    let result = teachers.filter((teacher) => {
      const searchLower = filters.search.toLowerCase().trim();
      const searchDigits = searchLower.replace(/\D/g, "");
      const name = (teacher.name ?? "").toLowerCase();
      const email = (teacher.email ?? "").toLowerCase();
      const phoneDigits = (teacher.phone ?? "").replace(/\D/g, "");
      const cpfDigits = (teacher.cpf ?? "").replace(/\D/g, "");
      const matchesSearch =
        !searchLower ||
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        (searchDigits.length > 0 && (phoneDigits.includes(searchDigits) || cpfDigits.includes(searchDigits)));
      if (!matchesSearch) return false;

      const status = teacher.status ?? "ativo";
      const matchesStatus = filters.status === "all" || status === filters.status;
      if (!matchesStatus) return false;

      const spec = (teacher as Teacher & { specialization?: string | null }).specialization?.trim();
      if (filters.specialization !== "all" && spec !== filters.specialization) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      const nameA = (a.name ?? "").toLowerCase();
      const nameB = (b.name ?? "").toLowerCase();
      if (filters.sortBy === "name_asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });
    return result;
  }, [teachers, filters]);

  const handleCreateOrUpdate = (data: TeacherInsert) => {
    const run = async () => {
      const normalizedEmail = data.email?.trim().toLowerCase();

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
          toast.error(MSG_EMAIL);
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
        if (normalizedEmail) {
          inviteTeacher.mutate(data, {
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
          createTeacher.mutate(data, {
            onSuccess: () => setIsFormOpen(false),
          });
        }
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

    const status = teacherToDelete.status ?? "ativo";
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
        { id: teacherToDelete.id, status: "ativo" },
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
    <>
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

          {/* Filtros avançados */}
          <TeachersFilters
            filters={filters}
            onChange={(newFilters) => {
              setFilters(newFilters);
              setPage(0);
            }}
            onReset={() => {
              setFilters({ ...defaultTeachersFilters, status: "ativo", sortBy: "name_asc" });
              setPage(0);
            }}
            specializations={specializations}
          />

          {/* Table */}
          <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
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
                  const status = teacher.status ?? "ativo";
                  const lastUpdatedAt = teacher.updated_at;

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
                              {status === "ativo" ? "Arquivar" : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Reativar professor
                                </>
                              )}
                            </DropdownMenuItem>
                            {status === "inativo" && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setTeacherToHardDelete(teacher);
                                  setHardDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir definitivamente
                              </DropdownMenuItem>
                            )}
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
            <TablePaginationBar
              page={page}
              pageSize={20}
              totalCount={totalCount}
              hasMore={hasMore}
              isFetching={isFetching}
              onPageChange={setPage}
            />
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
          isLoading={createTeacher.isPending || inviteTeacher.isPending || updateTeacher.isPending}
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

              <div className="flex justify-between gap-3 pt-2">
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

        {/* Modal de confirmação de status (arquivar/reativar) */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {(teacherToDelete?.status ?? "ativo") === "ativo"
                  ? "Confirmar arquivamento"
                  : "Confirmar reativação"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {(teacherToDelete?.status ?? "ativo") === "ativo" ? (
                  <>
                    Tem certeza que deseja arquivar o professor{" "}
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
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteTeacher.isPending || updateTeacher.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStatusChangeConfirm}
                disabled={deleteTeacher.isPending || updateTeacher.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTeacher.isPending || updateTeacher.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {(teacherToDelete?.status ?? "ativo") === "ativo"
                      ? "Arquivando..."
                      : "Reativando..."}
                  </>
                ) : (teacherToDelete?.status ?? "ativo") === "ativo" ? (
                  "Arquivar"
                ) : (
                  "Reativar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Hard Delete Confirmation Dialog */}
        <AlertDialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir definitivamente o professor{" "}
                <strong>{teacherToHardDelete?.name}</strong>?
                <br />
                <br />
                <strong className="text-destructive">Atenção:</strong> Todo o histórico de aulas
                deste professor será <strong>permanentemente removido</strong>. Esta ação não
                pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={hardDeleteTeacher.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!teacherToHardDelete) return;
                  hardDeleteTeacher.mutate(teacherToHardDelete.id, {
                    onSuccess: () => {
                      setHardDeleteDialogOpen(false);
                      setTeacherToHardDelete(null);
                    },
                  });
                }}
                disabled={hardDeleteTeacher.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {hardDeleteTeacher.isPending ? (
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
    </>
  );
}
