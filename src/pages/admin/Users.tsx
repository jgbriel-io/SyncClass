import { useState, useRef, useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody } from "@/components/ui/table";
import { Plus, User } from "lucide-react";
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
import { UsersTableRow } from "@/components/users/UsersTableRow";
import { TABLE_MIN_W as USER_TABLE_MIN_W } from "@/components/users/UsersTableRow.constants";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { UsersTableHeader } from "@/components/users/UsersTableHeader";
import { UsersStatsCards } from "@/components/users/UsersStatsCards";
import { common } from "@/content";
import { useUsersFilter } from "@/hooks/useUsersFilter";
import {
  getRoleVariant,
  getRoleLabel,
} from "@/components/users/userRoleHelpers";

export default function UsersPage() {
  const [filters, setFilters] = useState<UsersFiltersState>({
    ...defaultUsersFilters,
    status: "active",
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forceHardDelete, setForceHardDelete] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(
    null
  );
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [passwordDialogSource, setPasswordDialogSource] = useState<
    "create" | "reset" | null
  >(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] =
    useState<UserWithProfile | null>(null);

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

  const filteredUsers = useUsersFilter(users, filters);

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
            status: (data.studentData?.status || "ativo") as
              | "ativo"
              | "inativo",
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
        <UsersStatsCards
          total={usersStats.total}
          active={usersStats.active}
          inactive={usersStats.inactive}
          newThisMonth={usersStats.newThisMonth}
        />
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
      <div
        className="rounded-lg border bg-card shadow-card overflow-hidden"
        ref={listTopRef}
      >
        <div className="overflow-x-auto">
          <Table style={{ minWidth: USER_TABLE_MIN_W }}>
            <UsersTableHeader />
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
                        {
                          onSuccess: () => toast.success(common.toasts.success),
                        }
                      );
                    }}
                    onReactivateTeacher={(teacherId) => {
                      updateTeacher.mutate(
                        { id: teacherId, status: "ativo" },
                        {
                          onSuccess: () => toast.success(common.toasts.success),
                        }
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
            title={
              users.length === 0
                ? "Nenhum usuário cadastrado"
                : "Nenhum resultado"
            }
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
        isLoading={
          createUser.isPending ||
          updateRole.isPending ||
          updateProfile.isPending
        }
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
