import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TeachersFilters,
  type TeachersFiltersState,
} from "@/components/filters/TeachersFilters";
import { useTeachersPageStats } from "@/hooks/useTeachersPageStats";
import { defaultTeachersFilters } from "@/components/filters/filterDefaults";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody } from "@/components/ui/table";
import { Search, Plus } from "lucide-react";
import { TeacherFormDialog } from "@/components/teachers/TeacherFormDialog";
import { TeacherPasswordDialog } from "@/components/teachers/TeacherPasswordDialog";
import { TeacherStatusDialog } from "@/components/teachers/TeacherStatusDialog";
import { TeacherResetPasswordDialog } from "@/components/teachers/TeacherResetPasswordDialog";
import { TeacherHardDeleteDialog } from "@/components/teachers/TeacherHardDeleteDialog";
import { common } from "@/content";
import {
  useTeachers,
  useTeachersPaginated,
  useCreateTeacher,
  useUpdateTeacher,
  Teacher,
  TeacherInsert,
} from "@/hooks/useTeachers";
import { useInviteTeacher } from "@/hooks/useUsers";
import { useStudents } from "@/hooks/useStudents";
import { useClassLogs, ClassLogWithStudent } from "@/hooks/useClassLogs";
import {
  useFinancialRecords,
  FinancialRecordWithRelations,
} from "@/hooks/useFinancialRecords";
import { toast } from "sonner";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { TeachersTableSkeleton } from "@/components/ui/table-skeleton";
import { TeachersTableRow } from "@/components/teachers/TeachersTableRow";
import { TABLE_MIN_W as TEACH_TABLE_MIN_W } from "@/components/teachers/TeachersTableRow.constants";
import { TeachersTableHeader } from "@/components/teachers/TeachersTableHeader";
import { TeachersStatsCards } from "@/components/teachers/TeachersStatsCards";
import { TeacherDetailSheet } from "@/components/admin/TeacherDetailSheet";
import { PeriodFilter as PeriodFilterWidget } from "@/components/ui/period-filter";
import { type PeriodFilter } from "@/lib/utils/periodFilter";

export default function TeachersPage() {
  const [filters, setFilters] = useState<TeachersFiltersState>({
    ...defaultTeachersFilters,
    status: "ativo",
  });
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setSelectedTeacher(null);
      setIsFormOpen(true);
      setSearchParams(
        (prev) => {
          prev.delete("action");
          return prev;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [teacherToStatus, setTeacherToStatus] = useState<Teacher | null>(null);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [teacherToHardDelete, setTeacherToHardDelete] =
    useState<Teacher | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordDialogSource, setPasswordDialogSource] = useState<
    "create" | "reset"
  >("create");
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [teacherToResetPassword, setTeacherToResetPassword] =
    useState<Teacher | null>(null);

  // Detail sheet
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailTeacherId, setDetailTeacherId] = useState<string | null>(null);

  const listTopRef = useRef<HTMLDivElement>(null);

  const { data: allTeachers = [] } = useTeachers();
  const { data: allStudents = [] } = useStudents();
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
    pageSize: 10,
    filters: { status: filters.status, sortBy: filters.sortBy },
  });

  const createTeacher = useCreateTeacher();
  const inviteTeacher = useInviteTeacher();
  const updateTeacher = useUpdateTeacher();
  const { data: allClassLogs = [] } = useClassLogs();
  const { data: allFinancialRecords = [] } = useFinancialRecords();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const {
    studentCountByTeacher,
    totalClassesByTeacher,
    totalReceivedByTeacher,
    specializations,
    filteredTeachers,
    teachersStats,
  } = useTeachersPageStats(
    allTeachers,
    allStudents,
    allClassLogs as ClassLogWithStudent[],
    allFinancialRecords as FinancialRecordWithRelations[],
    teachers,
    filters,
    period
  );

  const handleCreateOrUpdate = (data: TeacherInsert) => {
    const run = async () => {
      const normalizedEmail = data.email?.trim().toLowerCase();

      if (!selectedTeacher && normalizedEmail) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (profileError) {
          toast.error(common.errors.validateEmail);
          return;
        }
        if (existingProfile) {
          toast.error(common.errors.duplicateEmail);
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
        inviteTeacher.mutate(data, {
          onSuccess: (result) => {
            setIsFormOpen(false);
            if (result?.password) {
              setGeneratedPassword(result.password);
              setPasswordDialogSource("create");
              setPasswordDialogOpen(true);
            }
          },
        });
      }
    };

    void run();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
              Professores
            </h1>
            <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">
              Gerencie os professores do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PeriodFilterWidget value={period} onChange={setPeriod} />
            <Button
              onClick={() => {
                setSelectedTeacher(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Professor
            </Button>
          </div>
        </div>

        {/* Cards informativos */}
        <TeachersStatsCards
          total={teachersStats.total}
          ativos={teachersStats.ativos}
          inativos={teachersStats.inativos}
          novos={teachersStats.novos}
          period={period}
        />

        {/* Filtros */}
        <TeachersFilters
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setPage(0);
          }}
          onReset={() => {
            setFilters({
              ...defaultTeachersFilters,
              status: "ativo",
              sortBy: "name_asc",
            });
            setPage(0);
          }}
          specializations={specializations}
        />

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">
              Erro ao carregar professores. Tente novamente.
            </p>
          </div>
        )}

        {/* Tabela */}
        {!error && (
          <div
            className="rounded-lg border bg-card shadow-card overflow-hidden"
            ref={listTopRef}
          >
            <div className="overflow-x-auto">
              <Table style={{ minWidth: TEACH_TABLE_MIN_W }}>
                <TeachersTableHeader />
                <TableBody className="divide-y divide-border/40">
                  {isLoading ? (
                    <TeachersTableSkeleton rows={10} />
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <TeachersTableRow
                        key={teacher.id}
                        teacher={teacher}
                        studentCount={
                          studentCountByTeacher.get(teacher.id) || 0
                        }
                        totalClasses={
                          totalClassesByTeacher.get(teacher.id) || 0
                        }
                        totalReceived={
                          totalReceivedByTeacher.get(teacher.id) || 0
                        }
                        onViewDetail={(id) => {
                          setDetailTeacherId(id);
                          setDetailSheetOpen(true);
                        }}
                        onEdit={(t) => {
                          setSelectedTeacher(t);
                          setIsFormOpen(true);
                        }}
                        onResetPassword={(t) => {
                          setTeacherToResetPassword(t);
                          setResetPasswordDialogOpen(true);
                        }}
                        onDelete={(t) => {
                          setTeacherToStatus(t);
                          setStatusDialogOpen(true);
                        }}
                        onHardDelete={(t) => {
                          setTeacherToHardDelete(t);
                          setHardDeleteDialogOpen(true);
                        }}
                        showHardDelete={true}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredTeachers.length === 0 && (
              <EmptyState
                icon={Search}
                title={
                  teachers.length === 0
                    ? "Nenhum professor cadastrado"
                    : "Nenhum resultado"
                }
                message={
                  teachers.length === 0
                    ? "Clique no botão 'Novo Professor' para adicionar o primeiro"
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
        )}
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
        isLoading={
          createTeacher.isPending ||
          inviteTeacher.isPending ||
          updateTeacher.isPending
        }
      />

      {/* Senha gerada/redefinida */}
      <TeacherPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        password={generatedPassword}
        source={passwordDialogSource}
      />

      {/* Redefinir senha */}
      <TeacherResetPasswordDialog
        open={resetPasswordDialogOpen}
        onOpenChange={(open) => {
          setResetPasswordDialogOpen(open);
          if (!open) setTeacherToResetPassword(null);
        }}
        teacher={teacherToResetPassword}
        onSuccess={(password) => {
          setGeneratedPassword(password);
          setPasswordDialogSource("reset");
          setPasswordDialogOpen(true);
        }}
      />

      {/* Arquivar / Reativar */}
      <TeacherStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        teacher={teacherToStatus}
        onClose={() => {
          setStatusDialogOpen(false);
          setTeacherToStatus(null);
        }}
      />

      {/* Excluir definitivamente */}
      <TeacherHardDeleteDialog
        open={hardDeleteDialogOpen}
        onOpenChange={setHardDeleteDialogOpen}
        teacher={teacherToHardDelete}
        onClose={() => {
          setHardDeleteDialogOpen(false);
          setTeacherToHardDelete(null);
        }}
      />

      {/* Detail Sheet */}
      <TeacherDetailSheet
        teacherId={detailTeacherId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </>
  );
}
