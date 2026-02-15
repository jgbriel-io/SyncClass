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
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Loader2, Shield, User, Link2, MoreHorizontal, Eye, EyeOff, Copy, Check, Trash2, Pencil, KeyRound, Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { getAvatarLetter } from "@/lib/utils/patterns";
import {
  useUsersPaginated,
  useUsersStats,
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
import { useStudents, useUpdateStudent, useHardDeleteStudent } from "@/hooks/useStudents";
import { useTeachers, useUpdateTeacher, useDeleteTeacher, useHardDeleteTeacher } from "@/hooks/useTeachers";
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
  type UsersFiltersState,
} from "@/components/filters/UsersFilters";
import { defaultUsersFilters } from "@/components/filters/filterDefaults";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { UsersTableSkeleton } from "@/components/ui/table-skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { UsersTableRow } from "@/components/users/UsersTableRow";
import { COL as USER_COL, TABLE_MIN_W as USER_TABLE_MIN_W } from "@/components/users/UsersTableRow.constants";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";

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
  const [passwordDialogSource, setPasswordDialogSource] = useState<"create" | "reset" | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<UserWithProfile | null>(null);
  const [resetPasswordNew, setResetPasswordNew] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");

  // Detail sheet state
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

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
  } = useUsersPaginated({ pageSize: 10, filters });
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const { data: linkedIds } = useLinkedProfileIds();
  const { data: usersStats } = useUsersStats();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);
  const createUser = useCreateUser();
  const updateRole = useUpdateUserRole();
  const updateProfile = useUpdateUserProfile();
  const deleteUser = useDeleteUser();
  const hardDeleteUser = useHardDeleteUser();
  const updateStudent = useUpdateStudent();
  const hardDeleteStudent = useHardDeleteStudent();
  const updateTeacher = useUpdateTeacher();
  const hardDeleteTeacher = useHardDeleteTeacher();
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
          studentData: {
            ...data.studentData,
            origin: (data.studentData?.origin || "outro") as "indicacao" | "google" | "instagram" | "passante" | "outro",
            status: (data.studentData?.status || "ativo") as "ativo" | "inativo",
          },
          teacherData: data.teacherData,
        },
        {
          onSuccess: (result: { password?: string }) => {
            setIsFormOpen(false);
            if (result?.password) {
              setGeneratedPassword(result.password);
              setShowGeneratedPassword(false);
              setPasswordCopied(false);
              setPasswordDialogSource("create");
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

    const { linkedStudent, linkedTeacher, isStudentActive, isTeacherActive, isHardDelete } = deleteDialogInfo;

    if (linkedStudent && isStudentActive) {
      // Arquiva: muda status para inativo (updateStudent já sincroniza profile.active = false)
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

    if (isHardDelete) {
      // Pega student_id/teacher_id direto do profile (a lista students filtra deleted_at IS NULL)
      const profileStudentId = selectedUser.profile?.student_id ?? null;
      const profileTeacherId = selectedUser.profile?.teacher_id ?? null;

      const doHardDeleteUser = () => {
        hardDeleteUser.mutate(selectedUser.id, {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setSelectedUser(null);
          },
        });
      };

      const doHardDeleteTeacherThenUser = () => {
        if (profileTeacherId) {
          hardDeleteTeacher.mutate(profileTeacherId, {
            onSuccess: doHardDeleteUser,
            onError: () => {
              // Mesmo se falhar, tenta excluir a conta
              doHardDeleteUser();
            },
          });
        } else {
          doHardDeleteUser();
        }
      };

      if (profileStudentId) {
        // Exclui o registro do aluno ANTES de remover a conta (senão o CASCADE do auth apaga o profile e perde a referência)
        hardDeleteStudent.mutate(profileStudentId, {
          onSuccess: doHardDeleteTeacherThenUser,
          onError: () => {
            // Mesmo se falhar, tenta continuar
            doHardDeleteTeacherThenUser();
          },
        });
      } else {
        doHardDeleteTeacherThenUser();
      }
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

  // Calcula se o dialog deve mostrar "Excluir definitivamente" ou "Arquivar".
  // Arquivar NÃO seta deleted_at, então o aluno permanece em students_active_masked
  // e linkedStudent sempre será encontrado enquanto existir.
  const deleteDialogInfo = useMemo(() => {
    const linkedStudent = selectedUser?.profile?.student_id
      ? students.find((s) => s.id === selectedUser.profile?.student_id)
      : null;
    const linkedTeacher = selectedUser?.profile?.teacher_id
      ? teachers.find((t) => t.id === selectedUser.profile?.teacher_id)
      : null;
    const isStudentActive = linkedStudent?.status === "ativo";
    const isTeacherActive = (linkedTeacher?.status ?? "ativo") === "ativo";
    const userIsInactive = !(selectedUser?.profile?.active ?? true);

    const isHardDelete =
      (linkedStudent && linkedStudent.status === "inativo") ||
      (linkedTeacher && linkedTeacher.status === "inativo") ||
      (!linkedStudent && !linkedTeacher && userIsInactive);

    const displayName =
      selectedUser?.profile?.full_name || selectedUser?.email || "este usuário";

    return { linkedStudent, linkedTeacher, isStudentActive, isTeacherActive, userIsInactive, isHardDelete, displayName };
  }, [selectedUser, students, teachers]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-sm mobile:text-xs tablet:text-xs mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">
            Gerencie usuários e privilégios
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

          {/* Cards informativos */}
          {usersStats && (
            <div className="grid gap-4 grid-cols-1 laptop:grid-cols-4">
              <StatCard
                title="Total de usuários"
                value={usersStats.total}
                icon={Users}
                variant="primary"
              />
              <StatCard
                title="Usuários ativos"
                value={usersStats.active}
                icon={UserCheck}
                variant="success"
              />
              <StatCard
                title="Usuários inativos"
                value={usersStats.inactive}
                icon={UserX}
                variant="muted"
              />
              <StatCard
                title="Novos este mês"
                value={usersStats.newThisMonth}
                icon={TrendingUp}
                variant="primaryHighlight"
              />
            </div>
          )}

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

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Erro ao carregar usuários. Tente novamente.
            </p>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
          <div className="overflow-x-auto">
            <Table style={{ minWidth: USER_TABLE_MIN_W }}>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: '1%' }}>Status</TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted" style={{ width: USER_COL.USUARIO, minWidth: USER_COL.USUARIO, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>Usuário</TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: USER_COL.PRIVILEGIO, minWidth: USER_COL.PRIVILEGIO }}>Privilégio</TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden lg:table-cell" style={{ width: USER_COL.VINCULO, minWidth: USER_COL.VINCULO }}>Vínculo</TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden md:table-cell" style={{ width: USER_COL.CADASTRO, minWidth: USER_COL.CADASTRO }}>Cadastro</TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: USER_COL.PLACEHOLDER, minWidth: USER_COL.PLACEHOLDER }} aria-label="Placeholder" />
                  <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: USER_COL.ACOES, minWidth: USER_COL.ACOES }}>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {isLoading ? (
                  <UsersTableSkeleton rows={10} />
                ) : (
                  filteredUsers.map((user) => (
                    <UsersTableRow
                      key={user.id}
                      user={user}
                      students={students}
                      teachers={teachers}
                      onViewDetail={(id) => {
                        setDetailUserId(id);
                        setDetailSheetOpen(true);
                      }}
                      onEdit={(u) => {
                        setSelectedUser(u);
                        setIsFormOpen(true);
                      }}
                      onResetPassword={(u) => {
                      setUserToResetPassword(u);
                      setResetPasswordNew("");
                      setResetPasswordConfirm("");
                      setResetPasswordDialogOpen(true);
                    }}
                    onLinkStudent={(u) => openLinkDialog(u, "student")}
                    onLinkTeacher={(u) => openLinkDialog(u, "teacher")}
                    onReactivateStudent={(studentId) => updateStudent.mutate({ id: studentId, status: "ativo" })}
                    onReactivateTeacher={(teacherId) => updateTeacher.mutate({ id: teacherId, status: "ativo" })}
                    onDelete={(u) => {
                      setSelectedUser(u);
                      setDeleteDialogOpen(true);
                    }}
                    onHardDelete={(u) => {
                      setSelectedUser(u);
                      setDeleteDialogOpen(true);
                    }}
                    getRoleLabel={getRoleLabel}
                    getRoleVariant={getRoleVariant}
                  />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {!isLoading && filteredUsers.length === 0 && (
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
            pageSize={10}
            totalCount={totalCount}
            hasMore={hasMore}
            isFetching={isFetching}
            onPageChange={setPage}
          />
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
            if (!open && generatedPassword && passwordDialogSource === "create") {
              toast.success("Usuário criado com sucesso!");
            }
            if (!open) setPasswordDialogSource(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {passwordDialogSource === "reset" ? "Senha redefinida" : "Senha criada para o usuário"}
              </DialogTitle>
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
              {userToResetPassword && (
                <DialogDescription>
                  Nova senha para <strong>{userToResetPassword.profile?.full_name ?? userToResetPassword.email}</strong>.
                </DialogDescription>
              )}
            </DialogHeader>
            {userToResetPassword && (
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
                      minLength={8}
                      disabled={adminResetPassword.isPending}
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
                      
                      adminResetPassword.mutate(
                        { userId: userToResetPassword.id, password: resetPasswordNew },
                        {
                          onSuccess: () => {
                            const passwordToShow = resetPasswordNew;
                            setResetPasswordDialogOpen(false);
                            setUserToResetPassword(null);
                            setResetPasswordNew("");
                            setResetPasswordConfirm("");
                            setGeneratedPassword(passwordToShow);
                            setShowGeneratedPassword(false);
                            setPasswordCopied(false);
                            setPasswordDialogSource("reset");
                            setIsPasswordDialogOpen(true);
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
                <div className="flex justify-end gap-4">
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
                <div className="flex justify-end gap-4">
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
                {deleteDialogInfo.isHardDelete
                  ? "Excluir definitivamente?"
                  : deleteDialogInfo.linkedStudent && deleteDialogInfo.isStudentActive
                    ? "Confirmar arquivamento"
                    : deleteDialogInfo.linkedTeacher && deleteDialogInfo.isTeacherActive
                      ? "Confirmar arquivamento"
                      : "Confirmar arquivamento do usuário"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDialogInfo.isHardDelete ? (
                  <>
                    A conta do usuário <strong>{deleteDialogInfo.displayName}</strong> será removida do sistema
                    (Supabase Auth, perfil e vínculos). Esta ação não pode ser desfeita.
                  </>
                ) : deleteDialogInfo.linkedStudent && deleteDialogInfo.isStudentActive ? (
                  <>
                    Tem certeza que deseja arquivar o usuário <strong>{deleteDialogInfo.displayName}</strong>?
                    Ele será removido da lista de ativos e aparecerá como aluno inativo.
                  </>
                ) : deleteDialogInfo.linkedTeacher && deleteDialogInfo.isTeacherActive ? (
                  <>
                    Tem certeza que deseja arquivar o usuário <strong>{deleteDialogInfo.displayName}</strong>?
                    Ele será removido da lista de ativos e aparecerá como professor inativo.
                  </>
                ) : (
                  <>
                    Tem certeza que deseja arquivar o usuário <strong>{deleteDialogInfo.displayName}</strong>?
                    Esta ação não remove a conta do Supabase Auth, apenas arquiva o usuário no painel.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={
                  deleteUser.isPending ||
                  hardDeleteStudent.isPending ||
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
                  hardDeleteStudent.isPending ||
                  updateStudent.isPending ||
                  hardDeleteUser.isPending ||
                  updateTeacher.isPending ||
                  deleteTeacher.isPending
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteUser.isPending ||
                hardDeleteStudent.isPending ||
                updateStudent.isPending ||
                hardDeleteUser.isPending ||
                updateTeacher.isPending ||
                deleteTeacher.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {deleteDialogInfo.isHardDelete ? "Excluindo..." : "Arquivando..."}
                  </>
                ) : (
                  deleteDialogInfo.isHardDelete ? "Excluir definitivamente" : "Arquivar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* User Detail Sheet */}
        <UserDetailSheet
          userId={detailUserId}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
        />
      </div>
  );
}
