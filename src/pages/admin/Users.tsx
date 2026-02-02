import { useState, useMemo, useRef, useEffect } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, Shield, User, Link2, MoreHorizontal, Eye, EyeOff, Copy, Check, Trash2, Pencil, KeyRound } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { getAvatarLetter } from "@/lib/utils/patterns";
import {
  useUsersPaginated,
  useLinkedProfileIds,
  useCreateUser,
  useUpdateUserRole,
  useUpdateUserProfile,
  useDeleteUser,
  useHardDeleteUser,
  useAdminResetPassword,
  useLinkUserToStudent,
  useLinkUserToTeacher,
  UserWithProfile,
} from "@/hooks/useUsers";
import { useStudents, useUpdateStudent } from "@/hooks/useStudents";
import { useTeachers, useUpdateTeacher, useDeleteTeacher } from "@/hooks/useTeachers";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  UsersFilters,
  defaultFilters,
  type UsersFiltersState,
} from "@/components/filters/UsersFilters";
import { defaultUsersFilters } from "@/components/filters/filterDefaults";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";

export default function UsersPage() {
  const [filters, setFilters] = useState<UsersFiltersState>({
    ...defaultUsersFilters,
    status: "active",
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [linkType, setLinkType] = useState<"student" | "teacher" | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<UserWithProfile | null>(null);
  const [resetPasswordNew, setResetPasswordNew] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");

  const listTopRef = useRef<HTMLDivElement>(null);
  const adminResetPassword = useAdminResetPassword();
  const {
    data: users = [],
    isLoading,
    error,
    page,
    setPage,
    hasMore,
    totalCount,
    isFetching,
  } = useUsersPaginated({ pageSize: 20 });
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const { data: linkedIds } = useLinkedProfileIds();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const createUser = useCreateUser();
  const updateRole = useUpdateUserRole();
  const updateProfile = useUpdateUserProfile();
  const deleteUser = useDeleteUser();
  const hardDeleteUser = useHardDeleteUser();
  const updateStudent = useUpdateStudent();
  const updateTeacher = useUpdateTeacher();
  const linkToStudent = useLinkUserToStudent();
  const linkToTeacher = useLinkUserToTeacher();
  const deleteTeacher = useDeleteTeacher();

  const filteredUsers = useMemo(() => {
    let result = users.filter((user) => {
      const name = user.profile?.full_name || "";
      const email = user.email || "";
      const searchLower = filters.search.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      const storedRole = (user.role?.role ?? user.profile?.role) as string | null;
      const linkedStudent = user.profile?.student_id;
      const linkedTeacher = user.profile?.teacher_id;
      const role =
        storedRole === "admin"
          ? "admin"
          : storedRole === "teacher"
          ? "teacher"
          : storedRole === "student"
          ? "student"
          : linkedTeacher
          ? "teacher"
          : linkedStudent
          ? "student"
          : storedRole;

      const matchesRole =
        filters.role === "all" ||
        (filters.role === "admin" && role === "admin") ||
        (filters.role === "teacher" && role === "teacher") ||
        (filters.role === "student" && role === "student");

      if (!matchesRole) return false;

      const isActive = user.profile?.active ?? true;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && isActive) ||
        (filters.status === "inactive" && !isActive);

      if (!matchesStatus) return false;

      return true;
    });

    const sortBy = filters.sortBy;
    result = [...result].sort((a, b) => {
      const nameA = (a.profile?.full_name || a.email || "").toLowerCase();
      const nameB = (b.profile?.full_name || b.email || "").toLowerCase();
      const createdA = new Date(a.profile?.created_at || a.created_at || 0).getTime();
      const createdB = new Date(b.profile?.created_at || b.created_at || 0).getTime();

      if (sortBy === "created_desc") return createdB - createdA;
      if (sortBy === "created_asc") return createdA - createdB;
      if (sortBy === "name_asc") return nameA.localeCompare(nameB);
      if (sortBy === "name_desc") return nameB.localeCompare(nameA);
      return 0;
    });

    return result;
  }, [users, filters]);

  const handleCreateOrUpdate = (data: {
    email: string;
    password?: string;
    fullName: string;
    role: "admin" | "student" | "teacher";
    studentData?: {
      name: string;
      state: string | null;
      city: string | null;
      cpf: string;
      phone: string;
      email: string;
      origin: string;
      status: string;
      birth_date: string | null;
      hourly_rate: number | null;
      classes_per_week: number | null;
      pay_day: number | null;
    };
    teacherData?: {
      name: string;
      email: string;
      phone?: string;
      cpf?: string;
    };
  }) => {
    if (selectedUser) {
      // Update existing user
      if (data.password) {
        // Update password via admin API
        // Note: Supabase Admin API doesn't have a direct password update
        // You might need to use resetPasswordForEmail or handle this differently
        console.warn("Password update not implemented via admin API");
      }
      
      updateProfile.mutate(
        {
          userId: selectedUser.id,
          fullName: data.fullName,
        },
        {
          onSuccess: () => {
            updateRole.mutate(
              {
                userId: selectedUser.id,
                role: data.role,
              },
              {
                onSuccess: () => {
                  setIsFormOpen(false);
                  setSelectedUser(null);
                },
              }
            );
          },
        }
      );
    } else {
      // Create new user from this screen (role selected in the form)
      createUser.mutate(
        {
          email: data.email,
          password: "",
          fullName: data.fullName,
          role: data.role,
          studentData: data.studentData,
          teacherData: data.teacherData,
        },
        {
          onSuccess: (result: { password?: string }) => {
            setIsFormOpen(false);
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
  };

  const handleLinkStudent = () => {
    if (selectedUser && selectedStudentId) {
      linkToStudent.mutate(
        {
          userId: selectedUser.id,
          studentId: selectedStudentId,
        },
        {
          onSuccess: () => {
            setIsLinkDialogOpen(false);
            setSelectedUser(null);
            setSelectedStudentId("");
          },
        }
      );
    }
  };

  const handleLinkTeacher = () => {
    if (selectedUser && selectedTeacherId) {
      linkToTeacher.mutate(
        {
          userId: selectedUser.id,
          teacherId: selectedTeacherId,
        },
        {
          onSuccess: () => {
            setIsLinkDialogOpen(false);
            setSelectedUser(null);
            setSelectedTeacherId("");
          },
        }
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!selectedUser) return;

    const linkedStudent = selectedUser.profile?.student_id
      ? students.find((s) => s.id === selectedUser.profile?.student_id)
      : null;
    const linkedTeacher = selectedUser.profile?.teacher_id
      ? teachers.find((t) => t.id === selectedUser.profile.teacher_id)
      : null;

    const isStudentActive = linkedStudent?.status === "ativo";
    const isTeacherActive = (linkedTeacher?.status ?? "ativo") === "ativo";
    const canHardDelete =
      (linkedStudent && linkedStudent.status === "inativo") ||
      (linkedTeacher && linkedTeacher.status === "inativo");

    if (linkedStudent && isStudentActive) {
      // Soft deactivate via student status so it reflects in both tabs
      updateStudent.mutate(
        { id: linkedStudent.id, status: "inativo" },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setSelectedUser(null);
          },
        }
      );
      return;
    }

    if (linkedTeacher && isTeacherActive) {
      // Soft deactivate via teacher status so it reflects in both tabs
      deleteTeacher.mutate(linkedTeacher.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
        },
      });
      return;
    }

    if (canHardDelete) {
      // Hard delete auth user (admin-only Edge Function)
      hardDeleteUser.mutate(selectedUser.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
        },
      });
      return;
    }

    // Fallback: just deactivate the profile (no linked student/teacher)
    deleteUser.mutate(selectedUser.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
    });
  };

  const openLinkDialog = (user: UserWithProfile, type: "student" | "teacher") => {
    setSelectedUser(user);
    setLinkType(type);
    setIsLinkDialogOpen(true);
  };

  const linkedStudentIds = linkedIds?.linkedStudentIds ?? new Set<string>();
  const linkedTeacherIds = linkedIds?.linkedTeacherIds ?? new Set<string>();
  const availableStudents = students.filter((s) => !linkedStudentIds.has(s.id));
  const availableTeachers = teachers.filter((t) => !linkedTeacherIds.has(t.id));

  const getRoleVariant = (role: string | null) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "student":
        return "success";
      case "teacher":
        return "info";
      default:
        return "warning";
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "student":
        return "Aluno";
      case "teacher":
        return "Professor";
      default:
        return "Sem privilégio";
    }
  };

  return (
    <>
    <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie usuários, privilégios e vínculos
              </p>
            </div>
            <Button onClick={() => {
              setSelectedUser(null);
              setIsFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          {/* Filtros avançados */}
          <UsersFilters
            filters={filters}
            onChange={(newFilters) => {
              setFilters(newFilters);
              setPage(0);
            }}
            onReset={() => {
              setFilters({ ...defaultUsersFilters, status: "active" });
              setPage(0);
            }}
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
              Erro ao carregar usuários. Tente novamente.
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Usuário
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider whitespace-nowrap">
                    Privilégio
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">
                    Vínculo
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider hidden md:table-cell whitespace-nowrap">
                    Cadastro
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider whitespace-nowrap">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredUsers.map((user) => {
                    const linkedStudent = user.profile?.student_id
                      ? students.find((s) => s.id === user.profile?.student_id)
                      : null;
                    const linkedTeacher = user.profile?.teacher_id
                      ? teachers.find((t) => t.id === user.profile.teacher_id)
                      : null;

                    const storedRole = (user.role?.role ?? user.profile?.role) as string | null ?? null;
                    const role = storedRole === "admin"
                      ? "admin"
                      : storedRole === "teacher"
                      ? "teacher"
                      : storedRole === "student"
                      ? "student"
                      : linkedTeacher
                      ? "teacher"
                      : linkedStudent
                      ? "student"
                      : storedRole;

                    const displayName = (user.profile?.full_name || "").trim() || "(sem nome)";
                    const avatarLetter = getAvatarLetter(displayName);
                    const subtitle = user.email || getRoleLabel(role);
                    const isActive = user.profile?.active ?? true;
                    const lastUpdatedAt = user.profile?.updated_at;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-accent-foreground">
                                {avatarLetter}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm whitespace-nowrap">
                                {displayName}
                              </p>
                              {subtitle && (
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {subtitle}
                                </p>
                              )}
                              {!isActive && (
                                <p className="text-[11px] text-amber-600">
                                  Conta arquivada
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge variant={getRoleVariant(role)}>
                              {getRoleLabel(role)}
                            </StatusBadge>
                            {!isActive && (
                              <span className="text-[11px] text-muted-foreground">
                                Arquivado
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">
                          {linkedStudent || linkedTeacher ? (
                            <div className="flex flex-col gap-1">
                              {linkedStudent && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">Aluno: {linkedStudent.name}</span>
                                </div>
                              )}
                              {linkedTeacher && (
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">Professor: {linkedTeacher.name}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell whitespace-nowrap">
                          <div className="flex flex-col text-xs text-muted-foreground">
                            <span>
                              {user.created_at
                                ? `Criado em ${format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}`
                                : "—"}
                            </span>
                            {lastUpdatedAt && (
                              <span className="mt-0.5">
                                {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                              </span>
                            )}
                          </div>
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
                            <DropdownMenuContent align="end" className="w-60">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setUserToResetPassword(user);
                                  setResetPasswordNew("");
                                  setResetPasswordConfirm("");
                                  setResetPasswordDialogOpen(true);
                                }}
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Redefinir senha
                              </DropdownMenuItem>
                              {role === "student" && !linkedStudent && (
                                <DropdownMenuItem
                                  onClick={() => openLinkDialog(user, "student")}
                                >
                                  Vincular aluno
                                </DropdownMenuItem>
                              )}
                              {role === "teacher" && !linkedTeacher && (
                                <DropdownMenuItem
                                  onClick={() => openLinkDialog(user, "teacher")}
                                >
                                  Vincular professor
                                </DropdownMenuItem>
                              )}
                              {linkedStudent && linkedStudent.status === "inativo" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    updateStudent.mutate({
                                      id: linkedStudent.id,
                                      status: "ativo",
                                    });
                                  }}
                                >
                                  Reativar aluno
                                </DropdownMenuItem>
                              )}
                              {linkedTeacher && linkedTeacher.status === "inativo" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    updateTeacher.mutate({
                                      id: linkedTeacher.id,
                                      status: "ativo",
                                    });
                                  }}
                                >
                                  Reativar professor
                                </DropdownMenuItem>
                              )}
                              {(() => {
                                const isStudentActive = linkedStudent?.status === "ativo";
                                const isTeacherActive = (linkedTeacher?.status ?? "ativo") === "ativo";
                                const userIsActive = isActive;
                                const canHardDelete =
                                  (linkedStudent && linkedStudent.status === "inativo") ||
                                  (linkedTeacher && linkedTeacher.status === "inativo");

                                const shouldShowDeactivate =
                                  userIsActive && (isStudentActive || isTeacherActive || (!linkedStudent && !linkedTeacher));

                                const label = shouldShowDeactivate
                                  ? "Arquivar"
                                  : canHardDelete
                                  ? "Excluir definitivamente"
                                  : "Inativo";

                                const disabled = !shouldShowDeactivate && !canHardDelete;

                                return (
                                  <DropdownMenuItem
                                    className="text-destructive hover:bg-destructive/10 data-[highlighted]:!bg-destructive/10 data-[highlighted]:!text-destructive"
                                    disabled={disabled}
                                    onClick={() => {
                                      if (disabled) return;
                                      setSelectedUser(user);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    {(!disabled && (shouldShowDeactivate || canHardDelete)) && (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    {label}
                                  </DropdownMenuItem>
                                );
                              })()}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <EmptyState
                icon={User}
                title={users.length === 0 ? "Nenhum usuário cadastrado" : "Nenhum resultado"}
                message={users.length === 0
                  ? "Clique no botão 'Novo Usuário' para adicionar o primeiro"
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
        )}
        </div>

        {/* Create/Edit User Dialog */}
        <UserFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelectedUser(null);
          }}
          user={selectedUser}
          onSubmit={handleCreateOrUpdate}
          isLoading={createUser.isPending || updateRole.isPending || updateProfile.isPending}
        />

        {/* Generated Password Dialog */}
        <Dialog
          open={isPasswordDialogOpen}
          onOpenChange={(open) => {
            setIsPasswordDialogOpen(open);
            if (!open && generatedPassword) {
              toast.success("Usuário criado com sucesso!");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Senha criada para o usuário</DialogTitle>
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

        {/* Redefinir senha (admin) */}
        <Dialog
          open={resetPasswordDialogOpen}
          onOpenChange={(open) => {
            setResetPasswordDialogOpen(open);
            if (!open) {
              setUserToResetPassword(null);
              setResetPasswordNew("");
              setResetPasswordConfirm("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Redefinir senha</DialogTitle>
            </DialogHeader>
            {userToResetPassword && (
              <>
                <p className="text-sm text-muted-foreground">
                  Nova senha para <strong>{userToResetPassword.profile?.full_name ?? userToResetPassword.email}</strong>. Mínimo 6 caracteres.
                </p>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="reset-password-new">Nova senha</Label>
                    <Input
                      id="reset-password-new"
                      type="password"
                      placeholder="••••••••"
                      value={resetPasswordNew}
                      onChange={(e) => setResetPasswordNew(e.target.value)}
                      minLength={6}
                      disabled={adminResetPassword.isPending}
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
                      minLength={6}
                      disabled={adminResetPassword.isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
                      let p = "";
                      for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
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
                      setUserToResetPassword(null);
                      setResetPasswordNew("");
                      setResetPasswordConfirm("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    disabled={
                      adminResetPassword.isPending ||
                      resetPasswordNew.length < 6 ||
                      resetPasswordNew !== resetPasswordConfirm
                    }
                    onClick={() => {
                      if (resetPasswordNew.length < 6 || resetPasswordNew !== resetPasswordConfirm) return;
                      adminResetPassword.mutate(
                        { userId: userToResetPassword.id, password: resetPasswordNew },
                        {
                          onSuccess: () => {
                            setResetPasswordDialogOpen(false);
                            setUserToResetPassword(null);
                            setResetPasswordNew("");
                            setResetPasswordConfirm("");
                          },
                        }
                      );
                    }}
                  >
                    {adminResetPassword.isPending ? (
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

        {/* Link Dialog */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Vincular {linkType === "student" ? "Aluno" : "Professor"}
              </DialogTitle>
            </DialogHeader>
            {linkType === "student" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecione o aluno</label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLinkDialogOpen(false);
                      setSelectedStudentId("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleLinkStudent}
                    disabled={!selectedStudentId || linkToStudent.isPending}
                  >
                    {linkToStudent.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      "Vincular"
                    )}
                  </Button>
                </div>
              </div>
            )}
            {linkType === "teacher" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecione o professor</label>
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um professor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLinkDialogOpen(false);
                      setSelectedTeacherId("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleLinkTeacher}
                    disabled={!selectedTeacherId || linkToTeacher.isPending}
                  >
                    {linkToTeacher.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      "Vincular"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Deactivate/Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {(() => {
                  const linkedStudent = selectedUser?.profile?.student_id
                    ? students.find((s) => s.id === selectedUser.profile?.student_id)
                    : null;
                  const linkedTeacher = selectedUser?.profile?.teacher_id
                    ? teachers.find(
                        (t) => t.id === selectedUser.profile.teacher_id
                      )
                    : null;
                  const isStudentActive = linkedStudent?.status === "ativo";
                  const isTeacherActive = (linkedTeacher?.status ?? "ativo") === "ativo";

                  if (linkedStudent && isStudentActive) {
                    return "Confirmar arquivamento";
                  }

                  if (linkedTeacher && isTeacherActive) {
                    return "Confirmar arquivamento";
                  }

                  return "Confirmar arquivamento do usuário";
                })()}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {(() => {
                  const linkedStudent = selectedUser?.profile?.student_id
                    ? students.find((s) => s.id === selectedUser.profile?.student_id)
                    : null;
                  const linkedTeacher = selectedUser?.profile?.teacher_id
                    ? teachers.find(
                        (t) => t.id === selectedUser.profile.teacher_id
                      )
                    : null;
                  const isStudentActive = linkedStudent?.status === "ativo";
                  const isTeacherActive = (linkedTeacher?.status ?? "ativo") === "ativo";

                  const displayName =
                    selectedUser?.profile?.full_name || selectedUser?.email || "este usuário";

                  if (linkedStudent && isStudentActive) {
                    return (
                      <>
                        Tem certeza que deseja arquivar o usuário <strong>{displayName}</strong>?
                        Ele será removido da lista de ativos e aparecerá como aluno inativo.
                      </>
                    );
                  }

                  if (linkedTeacher && isTeacherActive) {
                    return (
                      <>
                        Tem certeza que deseja arquivar o usuário <strong>{displayName}</strong>?
                        Ele será removido da lista de ativos e aparecerá como professor inativo.
                      </>
                    );
                  }

                  return (
                    <>
                      Tem certeza que deseja arquivar o usuário <strong>{displayName}</strong>?
                      Esta ação não remove a conta do Supabase Auth, apenas arquiva o usuário no painel.
                    </>
                  );
                })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={
                  deleteUser.isPending ||
                  updateStudent.isPending ||
                  hardDeleteUser.isPending ||
                  updateTeacher.isPending ||
                  deleteTeacher.isPending
                }
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={
                  deleteUser.isPending ||
                  updateStudent.isPending ||
                  hardDeleteUser.isPending ||
                  updateTeacher.isPending ||
                  deleteTeacher.isPending
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteUser.isPending ||
                updateStudent.isPending ||
                hardDeleteUser.isPending ||
                updateTeacher.isPending ||
                deleteTeacher.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Arquivando...
                  </>
                ) : (
                  "Arquivar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
