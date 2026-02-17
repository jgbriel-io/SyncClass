import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, Eye, EyeOff, Copy, Check, KeyRound, Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
import { useCreateAuthUserForTeacher, useInviteTeacher, useResetPassword } from "@/hooks/useUsers";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [teacherToHardDelete, setTeacherToHardDelete] = useState<Teacher | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [passwordDialogContext, setPasswordDialogContext] = useState<"create" | "reset">("create");
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Reset password state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [teacherToResetPassword, setTeacherToResetPassword] = useState<Teacher | null>(null);
  const [resetPasswordNew, setResetPasswordNew] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Detail sheet state
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
  const deleteTeacher = useDeleteTeacher();
  const hardDeleteTeacher = useHardDeleteTeacher();
  const createTeacherUser = useCreateAuthUserForTeacher();
  const adminResetPassword = useResetPassword();

  // Buscar todas as aulas e registros financeiros
  const { data: allClassLogs = [] } = useClassLogs();
  const { data: allFinancialRecords = [] } = useFinancialRecords();

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  // Mapa de contagem de alunos ativos por professor
  const studentCountByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    allStudents.forEach((student) => {
      if (student.teacher_id && student.status === "ativo") {
        map.set(student.teacher_id, (map.get(student.teacher_id) || 0) + 1);
      }
    });
    return map;
  }, [allStudents]);

  // Mapa de total de aulas por professor
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

  // Mapa de valor total recebido por professor (cobranças pagas)
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

  const teachersStats = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
    const total = allTeachers.length;
    const ativos = allTeachers.filter((t) => (t.status ?? "ativo") === "ativo").length;
    const inativos = allTeachers.filter((t) => t.status === "inativo").length;
    const novos = allTeachers.filter((t) => {
      if (!t.created_at) return false;
      const createdDate = String(t.created_at).split("T")[0];
      return createdDate >= monthStart && createdDate <= monthEnd;
    }).length;
    return { total, ativos, inativos, novos };
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
        // Email é obrigatório, sempre usa inviteTeacher
        inviteTeacher.mutate(data, {
          onSuccess: (result) => {
            setIsFormOpen(false);
            if (result?.password) {
              setGeneratedPassword(result.password);
              setShowGeneratedPassword(false);
              setPasswordCopied(false);
              setPasswordDialogContext("create");
              setIsPasswordDialogOpen(true);
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
              <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">Professores</h1>
              <p className="text-sm mobile:text-xs tablet:text-xs mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">
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
            <StatCard
              title="Total de professores"
              value={teachersStats.total}
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Professores ativos"
              value={teachersStats.ativos}
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              title="Professores inativos"
              value={teachersStats.inativos}
              icon={UserX}
              variant="muted"
            />
            <StatCard
              title="Novos este mês"
              value={teachersStats.novos}
              icon={TrendingUp}
              variant="primaryHighlight"
            />
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

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-destructive">
                Erro ao carregar professores. Tente novamente.
              </p>
            </div>
          )}

          {/* Table */}
          {!error && (
          <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
            <div className="overflow-x-auto">
              <Table style={{ minWidth: TEACH_TABLE_MIN_W }}>
                <TableHeader>
                  <TableRow className="border-b bg-muted/50">
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: '1%' }}>Status</TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted" style={{ width: TEACH_COL.NOME, minWidth: TEACH_COL.NOME, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>Nome</TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.EMAIL, minWidth: TEACH_COL.EMAIL }}>Email</TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.TELEFONE, minWidth: TEACH_COL.TELEFONE }}>Telefone</TableHead>
                    <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.TOTAL_ALUNOS, minWidth: TEACH_COL.TOTAL_ALUNOS }}>Total Alunos</TableHead>
                    <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.TOTAL_AULAS, minWidth: TEACH_COL.TOTAL_AULAS }}>Total Aulas</TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.VALOR_RECEBIDO, minWidth: TEACH_COL.VALOR_RECEBIDO }}>Valor Recebido</TableHead>
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.PLACEHOLDER, minWidth: TEACH_COL.PLACEHOLDER }} aria-label="Placeholder" />
                    <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: TEACH_COL.ACOES, minWidth: TEACH_COL.ACOES }}>Ações</TableHead>
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
                      onEdit={handleEdit}
                      onResetPassword={(t) => {
                        setTeacherToResetPassword(t);
                        setResetPasswordNew("");
                        setResetPasswordConfirm("");
                        setResetPasswordDialogOpen(true);
                      }}
                      onDelete={(t) => {
                        setTeacherToDelete(t);
                        setDeleteDialogOpen(true);
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
                message={teachers.length === 0
                  ? "Clique no botão 'Novo Professor' para adicionar o primeiro"
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

        {/* Modal de senha gerada para professor */}
        <Dialog
          open={isPasswordDialogOpen}
          onOpenChange={(open) => {
            setIsPasswordDialogOpen(open);
            if (!open && generatedPassword && passwordDialogContext === "create") {
              toast.success("Conta criada para o professor.");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {passwordDialogContext === "reset" ? "Senha redefinida" : "Senha criada para o professor"}
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

        {/* Redefinir senha do professor */}
        <Dialog
          open={resetPasswordDialogOpen}
          onOpenChange={(open) => {
            setResetPasswordDialogOpen(open);
            if (!open) {
              setTeacherToResetPassword(null);
              setResetPasswordNew("");
              setResetPasswordConfirm("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Redefinir senha do professor</DialogTitle>
              {teacherToResetPassword && (
                <DialogDescription>
                  Nova senha para <strong>{teacherToResetPassword.name}</strong>. Mínimo 6 caracteres.
                </DialogDescription>
              )}
            </DialogHeader>
            {teacherToResetPassword && (
              <>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="reset-pw-teacher-new">Nova senha</Label>
                    <Input
                      id="reset-pw-teacher-new"
                      type="password"
                      placeholder="••••••••"
                      value={resetPasswordNew}
                      onChange={(e) => setResetPasswordNew(e.target.value)}
                      minLength={6}
                      disabled={resetPasswordLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-pw-teacher-confirm">Confirmar senha</Label>
                    <Input
                      id="reset-pw-teacher-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={resetPasswordConfirm}
                      onChange={(e) => setResetPasswordConfirm(e.target.value)}
                      minLength={6}
                      disabled={resetPasswordLoading}
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
                      setTeacherToResetPassword(null);
                      setResetPasswordNew("");
                      setResetPasswordConfirm("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    disabled={
                      resetPasswordLoading ||
                      resetPasswordNew.length < 6 ||
                      resetPasswordNew !== resetPasswordConfirm
                    }
                    onClick={async () => {
                      if (!teacherToResetPassword) return;
                      setResetPasswordLoading(true);
                      try {
                        // Buscar user_id vinculado ao professor via profiles
                        const { data: profile, error: profileError } = await supabase
                          .from("profiles")
                          .select("user_id")
                          .eq("teacher_id", teacherToResetPassword.id)
                          .maybeSingle();

                        if (profileError || !profile?.user_id) {
                          toast.error("Este professor não possui conta de acesso vinculada.");
                          setResetPasswordLoading(false);
                          return;
                        }

                        adminResetPassword.mutate(
                          { userId: profile.user_id, password: resetPasswordNew },
                          {
                            onSuccess: () => {
                              setResetPasswordDialogOpen(false);
                              setTeacherToResetPassword(null);
                              setResetPasswordNew("");
                              setResetPasswordConfirm("");
                              setGeneratedPassword(resetPasswordNew);
                              setPasswordDialogContext("reset");
                              setIsPasswordDialogOpen(true);
                              setResetPasswordLoading(false);
                            },
                            onError: () => {
                              setResetPasswordLoading(false);
                            },
                          }
                        );
                      } catch {
                        toast.error("Erro ao buscar conta do professor.");
                        setResetPasswordLoading(false);
                      }
                    }}
                  >
                    {resetPasswordLoading ? (
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

        {/* Hard Delete Confirmation Dialog */}
        <AlertDialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">⚠️ EXCLUSÃO PERMANENTE</AlertDialogTitle>
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
                  hardDeleteTeacher.mutate({ id: teacherToHardDelete.id, force: false }, {
                    onSuccess: () => {
                      setHardDeleteDialogOpen(false);
                      setTeacherToHardDelete(null);
                    },
                    onError: (error) => {
                      const errorMessage = (error as Error).message;
                      
                      // Se o erro contém informações sobre aulas futuras, mostrar modal de confirmação
                      if (errorMessage.includes("aula(s) agendada(s)")) {
                        setHardDeleteDialogOpen(false);
                        
                        // Extrair número de aulas
                        const numAulas = errorMessage.match(/(\d+) aula\(s\)/)?.[1] || "?";
                        
                        // Mostrar confirmação final
                        const userInput = window.prompt(
                          `⚠️ ATENÇÃO - EXCLUSÃO PERMANENTE\n\n${errorMessage}\n\nPara confirmar a exclusão permanente de ${teacherToHardDelete.name} e TODAS as ${numAulas} aulas agendadas, digite: CONFIRMAR`
                        );
                        
                        if (userInput === "CONFIRMAR") {
                          // Força a exclusão ignorando a validação
                          hardDeleteTeacher.mutate({ id: teacherToHardDelete.id, force: true }, {
                            onSuccess: () => {
                              setTeacherToHardDelete(null);
                              toast.success("Professor e todas as aulas foram excluídos permanentemente.");
                            },
                          });
                        } else {
                          toast.info("Exclusão cancelada.");
                          setTeacherToHardDelete(null);
                        }
                      }
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

        {/* Teacher Detail Sheet */}
        <TeacherDetailSheet
          teacherId={detailTeacherId}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
        />
    </>
  );
}
