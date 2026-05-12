import { useState, useMemo, useRef, useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, User, UserCheck, UserX, TrendingUp, Users } from "lucide-react";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { PasswordDisplayDialog } from "@/components/users/PasswordDisplayDialog";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import {
  useUsersPaginated,
  useUsersStats,
  useCreateUser,
  useUpdateUserRole,
  useUpdateUserProfile,
  UserWithProfile,
} from "@/hooks/useUsers";
import { useStudents, useUpdateStudent } from "@/hooks/useStudents";
import { useTeachers, useUpdateTeacher } from "@/hooks/useTeachers";
import { StatusBadge } from "@/components/ui/status-badge";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forceHardDelete, setForceHardDelete] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [passwordDialogSource, setPasswordDialogSource] = useState<"create" | "reset" | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<UserWithProfile | null>(null);

  // Detail sheet state
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const listTopRef = useRef<HTMLDivElement>(null);
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
  const { data: usersStats } = useUsersStats();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const createUser = useCreateUser();
  const updateRole = useUpdateUserRole();
  const updateProfile = useUpdateUserProfile();
  const updateStudent = useUpdateStudent();
  const updateTeacher = useUpdateTeacher();

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
      updateProfile.mutate(
        { userId: selectedUser.id, fullName: data.fullName },
        {
          onSuccess: () => {
            updateRole.mutate(
              { userId: selectedUser.id, role: data.role },
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
      createUser.mutate(
        {
          email: data.email,
          password: "",
          fullName: data.fullName,
          role: data.role,
          studentData: {
            ...data.studentData,
            origin: (data.studentData?.origin || "outro") as
              | "indicacao"
              | "google"
              | "instagram"
              | "passante"
              | "outro",
            status: (data.studentData?.status || "ativo") as "ativo" | "inativo",
          },
          teacherData: data.teacherData,
        },
        {
          onSuccess: (result: { password?: string }) => {
            setIsFormOpen(false);
            if (result?.password) {
              setGeneratedPassword(result.password);
              setPasswordDialogSource("create");
              setIsPasswordDialogOpen(true);
            }
          },
        }
      );
    }
  };

  const getRoleVariant = (role: string | null) => {
    switch (role) {
      case "admin": return "destructive";
      case "student": return "success";
      case "teacher": return "info";
      default: return "warning";
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin": return "Administrador";
      case "student": return "Aluno";
      case "teacher": return "Professor";
      default: return "Sem privilégio";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
            Usuários
          </h1>
          <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">
            Gerencie usuários e privilégios
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Cards informativos */}
      {usersStats && (
        <div className="grid gap-4 grid-cols-1 laptop:grid-cols-4">
          <StatCard title="Total de usuários" value={usersStats.total} icon={Users} variant="primary" />
          <StatCard title="Usuários ativos" value={usersStats.active} icon={UserCheck} variant="success" />
          <StatCard title="Usuários inativos" value={usersStats.inactive} icon={UserX} variant="muted" />
          <StatCard title="Novos este mês" value={usersStats.newThisMonth} icon={TrendingUp} variant="primaryHighlight" />
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
          <p className="text-destructive">Erro ao carregar usuários. Tente novamente.</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
        <div className="overflow-x-auto">
          <Table style={{ minWidth: USER_TABLE_MIN_W }}>
            <TableHeader>
              <TableRow className="border-b bg-muted/50">
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: "1%" }}>
                  Status
                </TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted" style={{ width: USER_COL.USUARIO, minWidth: USER_COL.USUARIO, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>
                  Usuário
                </TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: USER_COL.PRIVILEGIO, minWidth: USER_COL.PRIVILEGIO }}>
                  Privilégio
                </TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden lg:table-cell" style={{ width: USER_COL.VINCULO, minWidth: USER_COL.VINCULO }}>
                  Vínculo
                </TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden md:table-cell" style={{ width: USER_COL.CADASTRO, minWidth: USER_COL.CADASTRO }}>
                  Cadastro
                </TableHead>
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: USER_COL.PLACEHOLDER, minWidth: USER_COL.PLACEHOLDER }} aria-label="Placeholder" />
                <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: USER_COL.ACOES, minWidth: USER_COL.ACOES }}>
                  Ações
                </TableHead>
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
                      setResetPasswordDialogOpen(true);
                    }}
                    onReactivateStudent={(studentId) => {
                      updateStudent.mutate(
                        { id: studentId, status: "ativo" },
                        { onSuccess: () => toast.success("Aluno reativado com sucesso!") }
                      );
                    }}
                    onReactivateTeacher={(teacherId) => {
                      updateTeacher.mutate(
                        { id: teacherId, status: "ativo" },
                        { onSuccess: () => toast.success("Professor reativado com sucesso!") }
                      );
                    }}
                    onDelete={(u) => {
                      setSelectedUser(u);
                      setForceHardDelete(false);
                      setDeleteDialogOpen(true);
                    }}
                    onHardDelete={(u) => {
                      setSelectedUser(u);
                      setForceHardDelete(true);
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
            message={
              users.length === 0
                ? "Clique no botão 'Novo Usuário' para adicionar o primeiro"
                : "Ajuste os filtros acima ou limpe a busca"
            }
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
      <PasswordDisplayDialog
        open={isPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) setPasswordDialogSource(null);
        }}
        password={generatedPassword}
        source={passwordDialogSource}
      />

      {/* Redefinir senha (admin) */}
      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        onOpenChange={(open) => {
          setResetPasswordDialogOpen(open);
          if (!open) setUserToResetPassword(null);
        }}
        user={userToResetPassword}
        onSuccess={(password) => {
          setGeneratedPassword(password);
          setPasswordDialogSource("reset");
          setIsPasswordDialogOpen(true);
        }}
      />

      {/* Deactivate/Delete Confirmation Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setForceHardDelete(false);
        }}
        user={selectedUser}
        forceHardDelete={forceHardDelete}
        students={students}
        teachers={teachers}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
          setForceHardDelete(false);
        }}
      />

      {/* User Detail Sheet */}
      <UserDetailSheet
        userId={detailUserId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  );
}
