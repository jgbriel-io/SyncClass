import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Loader2,
  Clock,
  Search,
  FileStack,
  Inbox,
  CheckCircle2,
} from "lucide-react";
import { useActivities, useDeleteActivity, getActivityFileUrl, getActivityDisplayStatus, formatActivityDueDate, ActivityWithRelations } from "@/hooks/useActivities";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { SendActivityDialog } from "@/components/activities/SendActivityDialog";
import { EditActivityDialog } from "@/components/activities/EditActivityDialog";
import { AddCorrectionDialog } from "@/components/activities/AddCorrectionDialog";
import { ActivityDetailSheet } from "@/components/activities/ActivityDetailSheet";
import { EmptyActivitiesState } from "@/components/ui/contextual-empty-states";
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
import { ActivitiesTableSkeleton } from "@/components/ui/table-skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  tableThLarge,
  tableThMedium,
  tableThSmall,
  tableThSmallRight,
} from "@/lib/utils/tableColumns";
import { cn } from "@/lib/utils";
import { Table, TableHeader, TableHead, TableBody, TableRow } from "@/components/ui/table";
import { ActivitiesTableRow } from "@/components/activities/ActivitiesTableRow";
import { COL as ACT_COL, TABLE_MIN_W as ACT_TABLE_MIN_W } from "@/components/activities/ActivitiesTableRow.constants";
import {
  ActivitiesFilters,
  type ActivitiesFiltersState,
} from "@/components/filters/ActivitiesFilters";
import { defaultActivitiesFilters } from "@/components/filters/filterDefaults";
import { toast } from "sonner";

const PAGE_SIZE = 10;

interface ActivitiesViewProps {
  title?: string;
  subtitle?: string;
  /** Teacher ID para filtrar atividades. undefined = todas (admin). */
  autoTeacherId?: string | null;
  /** Modo admin: mostra todas e oculta botão de enviar */
  isAdmin?: boolean;
}

export function ActivitiesView({
  title = "Atividades",
  subtitle = "Envie materiais e correções para seus alunos",
  autoTeacherId = null,
  isAdmin = false,
}: ActivitiesViewProps) {
  const [filters, setFilters] = useState<ActivitiesFiltersState>(defaultActivitiesFilters);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityWithRelations | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<ActivityWithRelations | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [activityForDetail, setActivityForDetail] = useState<ActivityWithRelations | null>(null);
  const [openSheetInCorrectionMode, setOpenSheetInCorrectionMode] = useState(false);
  const [page, setPage] = useState(0);
  const listTopRef = useRef<HTMLDivElement>(null);

  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const activeStudents = students.filter((s) => s.status === "ativo");

  const effectiveStudentId = filters.studentId !== "all" ? filters.studentId : undefined;
  const effectiveTeacherId = isAdmin && filters.teacherId !== "all" ? filters.teacherId : (autoTeacherId || undefined);
  
  const { data: activities = [], isLoading, refetch } = useActivities(
    effectiveTeacherId,
    effectiveStudentId,
    isAdmin && !effectiveStudentId ? { fetchAll: true } : undefined,
  );
  const deleteActivity = useDeleteActivity();

  const isOverdue = useCallback((a: ActivityWithRelations) =>
    a.status === "enviada" && a.due_date && new Date(a.due_date).getTime() < Date.now(),
    []
  );

  const handleViewFile = async (filePath: string) => {
    try {
      const url = await getActivityFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível abrir o arquivo.");
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      toast.loading("Preparando download...");
      const signedUrl = await getActivityFileUrl(filePath);
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success("Download concluído");
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      toast.dismiss();
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleDeleteConfirm = () => {
    if (activityToDelete) {
      deleteActivity.mutate(activityToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setActivityToDelete(null);
        },
      });
    }
  };

  const totalActivities = activities.length;
  const countEmAndamento = activities.filter((a) => a.status === "enviada" && !isOverdue(a)).length;
  const countVencida = activities.filter((a) => isOverdue(a)).length;
  const countEntregue = activities.filter((a) => a.status === "entregue").length;
  const countCorrigida = activities.filter((a) => a.status === "corrigida").length;

  const filteredActivities = useMemo(() => {
    let result = activities.filter((a) => {
      // Busca
      const searchLower = filters.search.toLowerCase().trim();
      const matchSearch =
        !searchLower ||
        (a.students?.name || "").toLowerCase().includes(searchLower) ||
        (a.title || "").toLowerCase().includes(searchLower) ||
        (a.description || "").toLowerCase().includes(searchLower);
      if (!matchSearch) return false;

      // Status
      const matchStatus =
        filters.status === "all" ||
        (filters.status === "vencida" ? isOverdue(a) : a.status === filters.status);
      if (!matchStatus) return false;

      // Período
      if (filters.period !== "all" && a.created_at) {
        const now = new Date();
        const createdDate = new Date(a.created_at);
        const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.period === "week" && diffDays > 7) return false;
        if (filters.period === "month" && diffDays > 30) return false;
        if (filters.period === "3months" && diffDays > 90) return false;
      }

      return true;
    });

    // Ordenação
    result = [...result].sort((a, b) => {
      const studentA = (a.students?.name || "").toLowerCase();
      const studentB = (b.students?.name || "").toLowerCase();
      const dueA = a.due_date ? new Date(a.due_date).getTime() : 0;
      const dueB = b.due_date ? new Date(b.due_date).getTime() : 0;
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (filters.sortBy === "due_asc") return dueA - dueB;
      if (filters.sortBy === "due_desc") return dueB - dueA;
      if (filters.sortBy === "created_desc") return createdB - createdA;
      if (filters.sortBy === "created_asc") return createdA - createdB;
      if (filters.sortBy === "student_asc") return studentA.localeCompare(studentB);
      if (filters.sortBy === "student_desc") return studentB.localeCompare(studentA);
      return 0;
    });

    return result;
  }, [activities, filters, isOverdue]);

  const totalFiltered = filteredActivities.length;
  const paginatedActivities = filteredActivities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasMore = (page + 1) * PAGE_SIZE < totalFiltered;

  useEffect(() => {
    setPage(0);
  }, [filters]);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setSendDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Enviar Atividade
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 laptop:grid-cols-5">
        <StatCard title="Total" value={totalActivities} icon={FileStack} variant="primary" />
        <StatCard title="Aguardando" value={countEmAndamento} icon={Inbox} variant="muted" />
        <StatCard title="Vencidas" value={countVencida} icon={Clock} variant="default" />
        <StatCard title="Entregues" value={countEntregue} icon={Clock} variant="default" />
        <StatCard title="Corrigidas" value={countCorrigida} icon={CheckCircle2} variant="success" />
      </div>

      {/* Filtros */}
      <ActivitiesFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultActivitiesFilters)}
        students={activeStudents}
        teachers={teachers}
        showTeacherFilter={isAdmin}
        primaryStatus="all"
      />

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-card overflow-hidden">
        <Table style={{ minWidth: ACT_TABLE_MIN_W }}>
          <TableHeader>
            <TableRow className="border-b bg-muted/50">
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted" style={{ boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)', width: ACT_COL.ALUNO, minWidth: ACT_COL.ALUNO }}>Aluno</TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: ACT_COL.ATIVIDADE, minWidth: ACT_COL.ATIVIDADE }}>Atividade</TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden sm:table-cell" style={{ width: ACT_COL.ARQUIVO, minWidth: ACT_COL.ARQUIVO }}>Arquivo</TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden sm:table-cell" style={{ width: ACT_COL.PRAZO, minWidth: ACT_COL.PRAZO }}>Prazo</TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: ACT_COL.STATUS, minWidth: ACT_COL.STATUS }}>Status</TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden sm:table-cell" style={{ width: ACT_COL.ENTREGUE_EM, minWidth: ACT_COL.ENTREGUE_EM }}>Entregue em</TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap hidden xl:table-cell" style={{ width: ACT_COL.AVALIAR, minWidth: ACT_COL.AVALIAR }} aria-label="Avaliar" />
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: ACT_COL.ACOES, minWidth: ACT_COL.ACOES }}>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {isLoading ? (
              <ActivitiesTableSkeleton rows={10} />
            ) : paginatedActivities.length === 0 ? (
              <TableRow>
                <td colSpan={10} className="p-0">
                  <EmptyActivitiesState 
                    onAction={!isAdmin ? () => setSendDialogOpen(true) : undefined}
                    actionLabel="Enviar primeira atividade"
                  />
                </td>
              </TableRow>
            ) : (
              paginatedActivities.map((activity) => (
              <ActivitiesTableRow
                key={activity.id}
                activity={activity}
                isAdmin={isAdmin}
                onViewFile={handleViewFile}
                onDownload={handleDownload}
                onEdit={(activity) => {
                  setActivityToEdit(activity);
                  setEditDialogOpen(true);
                }}
                onDelete={(activity) => {
                  setActivityToDelete(activity);
                  setDeleteDialogOpen(true);
                }}
                onViewDetail={(activity, correctionMode) => {
                  setActivityForDetail(activity);
                  setOpenSheetInCorrectionMode(Boolean(correctionMode));
                  setDetailSheetOpen(true);
                }}
                onUpdateCorrection={(activity) => {
                  setSelectedActivity(activity);
                  setCorrectionDialogOpen(true);
                }}
              />
            ))
            )}
          </TableBody>
        </Table>

        <TablePaginationBar
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={totalFiltered}
          hasMore={hasMore}
          isFetching={isLoading}
          onPageChange={setPage}
        />
      </div>

      {/* Dialogs */}
      <SendActivityDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        teacherId={autoTeacherId || ""}
      />

      <EditActivityDialog
        activity={activityToEdit}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setActivityToEdit(null);
        }}
        teacherId={autoTeacherId ?? activityToEdit?.teacher_id ?? ""}
      />

      <AddCorrectionDialog
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
        activity={selectedActivity}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a atividade{" "}
              <strong>{activityToDelete?.title}</strong>?<br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteActivity.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteActivity.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteActivity.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActivityDetailSheet
        activity={activityForDetail}
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) setOpenSheetInCorrectionMode(false);
        }}
        onDownload={handleDownload}
        getStatusLabel={(a) => (a ? getActivityDisplayStatus(a).label : "")}
        getStatusVariant={(a) => (a ? getActivityDisplayStatus(a).variant : "default")}
        initialCorrectionMode={openSheetInCorrectionMode}
        onCorrectionSuccess={() => {
          setDetailSheetOpen(false);
          setOpenSheetInCorrectionMode(false);
          refetch().then((result) => {
            const list = result.data as ActivityWithRelations[] | undefined;
            if (list && activityForDetail) {
              const updated = list.find((a) => a.id === activityForDetail.id);
              if (updated) setActivityForDetail(updated);
            }
          });
        }}
      />
    </div>
  );
}
