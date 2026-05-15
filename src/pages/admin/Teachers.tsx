import { useState, useMemo, useRef, useEffect } from "react";
import {
  TeachersFilters,
  type TeachersFiltersState,
} from "@/components/filters/TeachersFilters";
import { defaultTeachersFilters } from "@/components/filters/filterDefaults";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
import { useCreateAuthUserForTeacher, useInviteTeacher } from "@/hooks/useUsers";
import { useStudents } from "@/hooks/useStudents";
import { useClassLogs } from "@/hooks/useClassLogs";
import { useFinancialRecords } from "@/hooks/useFinancialRecords";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { TeachersTableSkeleton } from "@/components/ui/table-skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { TeachersTableRow } from "@/components/teachers/TeachersTableRow";
import { COL as TEACH_COL, TABLE_MIN_W as TEACH_TABLE_MIN_W } from "@/components/teachers/TeachersTableRow.constants";
import { TeacherDetailSheet } from "@/components/admin/TeacherDetailSheet";

export default function TeachersPage() {
  const [filters, setFilters] = useState<TeachersFiltersState>({
    ...defaultTeachersFilters,
    status: "ativo",
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [teacherToStatus, setTeacherToStatus] = useState<Teacher | null>(null);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [teacherToHardDelete, setTeacherToHardDelete] = useState<Teacher | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordDialogSource, setPasswordDialogSource] = useState<"create" | "reset">("create");
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [teacherToResetPassword, setTeacherToResetPassword] = useState<Teacher | null>(null);

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
  const _createTeacherUser = useCreateAuthUserForTeacher();

  const { data: allClassLogs = [] } = useClassLogs();
  const { data: allFinancialRecords = [] } = useFinancialRecords();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const studentCountByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    allStudents.forEach((student) => {
      if (student.teacher_id && student.status === "ativo") {
        map.set(student.teacher_id, (map.get(student.teacher_id) || 0) + 1);
      }
    });
    return map;
  }, [allStudents]);

  const totalClassesByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    allClassLogs.forEach((log) => {
      const teacherId = log.students?.teacher_id;
      if (teacherId && log.attendance) {
        map.set(teacherId, (map.get(teacherId) || 0) + 1);
      }
    });
    return map;
  }, [allClassLogs]);

  const totalReceivedByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    allFinancialRecords.forEach((record) => {
      const teacherId = record.students?.teacher_id;
      if (teacherId && record.status === "pago" && record.amount) {
        map.set(teacherId, (map.get(teacherId) || 0) + Number(record.amount));
      }
    });
    return map;
  }, [allFinancialRecords]);

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
      const matchesSearch =
        !searchLower ||
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        (searchDigits.length > 0 && phoneDigits.includes(searchDigits));
      if (!matchesSearch) return false;

      const status = teacher.status ?? "ativo";
      if (filters.status !== "all" && status !== filters.status) return false;

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

  const teachersStats = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
    return {
      total: allTeachers.length,
      ativos: allTeachers.filter((t) => (t.status ?? "ativo") === "ativo").length,
      inativos: allTeachers.filter((t) => t.status === "inativo").length,
      novos: allTeachers.filter((t) => {
        if (!t.created_at) return false;
        const d = String(t.created_at).split("T")[0];
        return d >= monthStart && d <= monthEnd;
      }).length,
    };
  }, [allTeachers]);

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
          toast.error("Erro ao validar email. Tente novamente.");
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
          <Button
            onClick={() => {
              setSelectedTeacher(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Professor
          </Button>
        </div>

        {/* Cards informativos */}
        <div className="grid gap-4 grid-cols-1 laptop:grid-cols-4">
          <StatCard title="Total de professores" value={teachersStats.total} icon={Users} variant="primary" />
          <StatCard title="Professores ativos" value={teachersStats.ativos} icon={UserCheck} variant="success" />
          <StatCard title="Professores inativos" value={teachersStats.inativos} icon={UserX} variant="muted" />
          <StatCard title="Novos este mês" value={teachersStats.novos} icon={TrendingUp} variant="primaryHighlight" />
        </div>

        {/* Filtros */}
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

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Erro ao carregar professores. Tente novamente.</p>
          </div>
        )}

        {/* Tabela */}
        {!error && (
          <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
            <div className="overflow-x-auto">
              <Table style={{ minWidth: TEACH_TABLE_MIN_W }}>
                <TableHeader>
                  <TableRow className="border-b bg-muted/50">
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: "1%" }}>
                      Status
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted" style={{ width: TEACH_COL.NOME, minWidth: TEACH_COL.NOME, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>
                      Nome
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.EMAIL, minWidth: TEACH_COL.EMAIL }}>
                      Email
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.TELEFONE, minWidth: TEACH_COL.TELEFONE }}>
                      Telefone
                    </TableHead>
                    <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.TOTAL_ALUNOS, minWidth: TEACH_COL.TOTAL_ALUNOS }}>
                      Total Alunos
                    </TableHead>
                    <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.TOTAL_AULAS, minWidth: TEACH_COL.TOTAL_AULAS }}>
                      Total Aulas
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.VALOR_RECEBIDO, minWidth: TEACH_COL.VALOR_RECEBIDO }}>
                      Valor Recebido
                    </TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.PLACEHOLDER, minWidth: TEACH_COL.PLACEHOLDER }} aria-label="Placeholder" />
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.ACOES, minWidth: TEACH_COL.ACOES }}>
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {isLoading ? (
                    <TeachersTableSkeleton rows={10} />
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <TeachersTableRow
                        key={teacher.id}
                        teacher={teacher}
                        studentCount={studentCountByTeacher.get(teacher.id) || 0}
                        totalClasses={totalClassesByTeacher.get(teacher.id) || 0}
                        totalReceived={totalReceivedByTeacher.get(teacher.id) || 0}
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
                        showHardDelete={false}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredTeachers.length === 0 && (
              <EmptyState
                icon={Search}
                title={teachers.length === 0 ? "Nenhum professor cadastrado" : "Nenhum resultado"}
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
        isLoading={createTeacher.isPending || inviteTeacher.isPending || updateTeacher.isPending}
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
