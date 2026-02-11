import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Plus, MoreHorizontal, Download, FileText, Loader2, Edit, Trash2, Clock, Eye, Search, FileStack, Inbox, CheckCircle2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivities, useDeleteActivity, getActivityFileUrl, getActivityDisplayStatus, formatActivityDueDate, ActivityWithRelations } from "@/hooks/useActivities";
import { useStudents } from "@/hooks/useStudents";
import { SendActivityDialog } from "@/components/activities/SendActivityDialog";
import { EditActivityDialog } from "@/components/activities/EditActivityDialog";
import { AddCorrectionDialog } from "@/components/activities/AddCorrectionDialog";
import { ActivityDetailSheet } from "@/components/activities/ActivityDetailSheet";
import { EmptyActivitiesState } from "@/components/ui/contextual-empty-states";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const PAGE_SIZE = 10;
type StatusFilterValue = "all" | "enviada" | "vencida" | "entregue" | "corrigida";

const TeacherActivitiesPage = () => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const listTopRef = useRef<HTMLDivElement>(null);

  const { data: students = [] } = useStudents();
  const activeStudents = students.filter((s) => s.status === "ativo");

  const { data: teacherId, isLoading: teacherIdLoading } = useQuery({
    queryKey: ["teacherId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("teacher_id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data?.teacher_id as string | null;
    },
    enabled: !!user?.id && !isAdmin,
  });

  const effectiveStudentId = studentFilter !== "all" ? studentFilter : undefined;
  const { data: activities = [], isLoading, refetch } = useActivities(
    isAdmin ? undefined : (teacherId || undefined),
    effectiveStudentId,
    isAdmin && !effectiveStudentId ? { fetchAll: true } : undefined
  );
  const deleteActivity = useDeleteActivity();

  const handleViewFile = async (filePath: string) => {
    try {
      const url = await getActivityFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Não foi possível abrir o arquivo.");
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      toast.loading("Preparando download...");
      const signedUrl = await getActivityFileUrl(filePath);
      
      // Forçar download via fetch para evitar abrir em nova aba
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar memória
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

  const isOverdue = (a: ActivityWithRelations) =>
    a.status === "enviada" && a.due_date && new Date(a.due_date).getTime() < Date.now();

  // Estatísticas por status de exibição (prazo / atraso)
  const totalActivities = activities.length;
  const countEmAndamento = activities.filter((a) => a.status === "enviada" && !isOverdue(a)).length;
  const countVencida = activities.filter((a) => isOverdue(a)).length;
  const countEntregue = activities.filter((a) => a.status === "entregue").length;
  const countCorrigida = activities.filter((a) => a.status === "corrigida").length;

  // Filtro: busca + status (vencida = enviada com prazo passado)
  const filteredActivities = activities.filter((a) => {
    const matchSearch =
      !searchQuery.trim() ||
      (a.students?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "vencida" ? isOverdue(a) : a.status === statusFilter);
    return matchSearch && matchStatus;
  });

  const totalFiltered = filteredActivities.length;
  const paginatedActivities = filteredActivities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasMore = (page + 1) * PAGE_SIZE < totalFiltered;

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, studentFilter]);

  useEffect(() => {
    listTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">
            Atividades
          </h1>
          <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground mt-1">
            {isAdmin ? "Todas as atividades da plataforma" : "Envie materiais e correções para seus alunos"}
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setSendDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Enviar Atividade
          </Button>
        )}
      </div>

      {/* 5 Cards de estatísticas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 laptop:grid-cols-5">
        <StatCard
          title="Total"
          value={totalActivities}
          icon={FileStack}
          variant="primary"
        />
        <StatCard
          title="Em andamento"
          value={countEmAndamento}
          icon={Inbox}
          variant="muted"
        />
        <StatCard
          title="Vencidas"
          value={countVencida}
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Entregues"
          value={countEntregue}
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Corrigidas"
          value={countCorrigida}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno, título ou descrição..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilterValue)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="enviada">Em andamento</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="corrigida">Corrigida</SelectItem>
          </SelectContent>
        </Select>
        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Aluno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os alunos</SelectItem>
            {activeStudents.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name || "—"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Atividades */}
      {teacherIdLoading || isLoading ? (
        <div className="rounded-lg border bg-card shadow-card overflow-hidden">
          <TableSkeleton rows={8} columns={5} />
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-lg border bg-card">
          <EmptyActivitiesState
            onAction={() => setSendDialogOpen(true)}
            actionLabel="Enviar primeira atividade"
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-sm mobile:text-xs tablet:text-xs laptop:text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2">
                    Aluno
                  </th>
                  {isAdmin && (
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 hidden sm:table-cell">
                      Professor
                    </th>
                  )}
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2">
                    Atividade
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 hidden sm:table-cell max-w-[180px]">
                    Arquivo
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 hidden sm:table-cell whitespace-nowrap">
                    Prazo
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2">
                      <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs font-medium">{activity.students?.name}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 hidden sm:table-cell">
                        <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">{activity.teachers?.name ?? "—"}</span>
                      </td>
                    )}
                    <td className="px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2">
                      <div className="min-w-0">
                        <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 hidden sm:table-cell max-w-[180px]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate" title={activity.file_name}>{activity.file_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 hidden sm:table-cell whitespace-nowrap">
                      <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                        {formatActivityDueDate(activity.due_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2">
                      <StatusBadge variant={getActivityDisplayStatus(activity).variant}>
                        {getActivityDisplayStatus(activity).label}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex items-center -space-x-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewFile(activity.file_url)}
                              aria-label="Visualizar arquivo"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver anexo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownload(activity.file_url, activity.file_name)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar arquivo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setActivityToEdit(activity);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar atividade
                            </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setActivityToDelete(activity);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setActivityForDetail(activity);
                              setDetailSheetOpen(true);
                            }}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        {activity.status === "enviada" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="h-8 opacity-50 cursor-not-allowed"
                          >
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            Aguardando
                          </Button>
                        ) : activity.status === "entregue" ? (
                          <Button
                            size="sm"
                            className="h-8 border-none bg-[#25D366] text-white hover:bg-[#1ebe57]"
                            onClick={() => {
                              setActivityForDetail(activity);
                              setOpenSheetInCorrectionMode(true);
                              setDetailSheetOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Corrigir
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 border-none bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setCorrectionDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Atualizar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {(totalFiltered > 0 || page > 0) && (
            <div className="border-t px-6 py-3 flex items-center justify-between gap-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {totalFiltered > 0
                  ? `Mostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalFiltered)} de ${totalFiltered}`
                  : "Nenhum resultado"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <SendActivityDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        teacherId={teacherId || ""}
      />

      <EditActivityDialog
        activity={activityToEdit}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setActivityToEdit(null);
        }}
        teacherId={teacherId ?? activityToEdit?.teacher_id ?? ""}
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
            <AlertDialogCancel disabled={deleteActivity.isPending}>
              Cancelar
            </AlertDialogCancel>
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
};

export default TeacherActivitiesPage;
