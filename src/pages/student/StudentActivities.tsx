import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActivities, useMarkActivityAsDelivered, getActivityDisplayStatus, formatActivityDueDate, ActivityWithRelations, getActivityFileUrl } from "@/hooks/useActivities";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyActivitiesStudentState } from "@/components/ui/contextual-empty-states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Download, FileText, Loader2, Check, MessageSquare, File, Eye, ChevronDown, ChevronUp, User, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { DeliverActivityDialog } from "@/components/activities/DeliverActivityDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";

const StudentActivitiesPage = () => {
  const { user } = useAuth();
  const [deliverDialogOpen, setDeliverDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithRelations | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: studentId, isLoading: studentIdLoading } = useQuery({
    queryKey: ["studentId", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("student_id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data?.student_id as string | null;
    },
    enabled: !!user?.id,
  });

  const { data: activities = [], isLoading } = useActivities(undefined, studentId || undefined);
  const markAsDelivered = useMarkActivityAsDelivered();

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

  const handleOpenDeliverDialog = (activity: ActivityWithRelations) => {
    setSelectedActivity(activity);
    setDeliverDialogOpen(true);
  };

  const handleDeliverActivity = async (data: {
    responseText?: string;
    responseFileUrl?: string;
    responseFileName?: string;
  }) => {
    if (!selectedActivity) return;

    await markAsDelivered.mutateAsync({
      activityId: selectedActivity.id,
      responseText: data.responseText,
      responseFileUrl: data.responseFileUrl,
      responseFileName: data.responseFileName,
    });
  };

  return (
    <PageContainer constrained maxWidth="5xl">
      {/* Header */}
      <div className="mb-4">
        <h1 className={typography('H1')}>Minhas Atividades</h1>
        <p className={`${typography('SMALL')} mt-1`}>
          Visualize e entregue as atividades enviadas pelo seu professor
        </p>
      </div>

      {/* Loading */}
      {(studentIdLoading || isLoading) && (
        <div className="rounded-lg border bg-card flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Lista de Atividades */}
      {!studentIdLoading && !isLoading && activities.length === 0 && (
        <div className="rounded-lg border bg-card">
          <EmptyActivitiesStudentState />
        </div>
      )}

      {!studentIdLoading && !isLoading && activities.length > 0 && (
        <div className={stack('DEFAULT')}>
          <h2 className={typography('TABLE_HEADER')}>
            Atividades
          </h2>
          <div className={stack('DEFAULT')}>
            {activities.map((activity) => (
              <Collapsible
                key={activity.id}
                open={expandedId === activity.id}
                onOpenChange={(open) => setExpandedId(open ? activity.id : null)}
              >
                <Card className="p-4 overflow-hidden">
                  <div className={`flex items-start justify-between ${gap('LOOSE')}`}>
                    <div className={`${stack('DEFAULT')} flex-1 min-w-0`}>
                      {/* Título + Badge (cada um no seu canto) */}
                      <div className={`flex items-center justify-between ${gap('DEFAULT')}`}>
                        <h3 className={`${typography('BODY_SEMIBOLD')} truncate min-w-0`}>
                          {activity.title}
                        </h3>
                        <StatusBadge variant={getActivityDisplayStatus(activity).variant} className="shrink-0">
                          {getActivityDisplayStatus(activity).label}
                        </StatusBadge>
                      </div>

                      {/* Lista de informações com ícones */}
                      <div className={`flex items-center ${gap('TIGHT')} ${typography('SMALL')}`}>
                        <User className={`${iconSize('SM')} flex-shrink-0`} />
                        <span>Professor: {activity.teachers?.name || "—"}</span>
                      </div>
                      <div className={`flex items-center ${gap('TIGHT')} ${typography('SMALL')}`}>
                        <Calendar className={`${iconSize('SM')} flex-shrink-0`} />
                        <span>Enviada em {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      {activity.due_date && (
                        <div className={`flex items-center ${gap('TIGHT')} ${typography('SMALL')}`}>
                          <Clock className={`${iconSize('SM')} flex-shrink-0`} />
                          <span>Prazo: {formatActivityDueDate(activity.due_date)}</span>
                        </div>
                      )}
                      {activity.delivered_at && (
                        <div className={`flex items-center ${gap('TIGHT')} ${typography('SMALL')}`}>
                          <Clock className={`${iconSize('SM')} flex-shrink-0`} />
                          <span>Entregue em {format(new Date(activity.delivered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      )}

                      {/* Conteúdo expandido */}
                      <CollapsibleContent>
                        <div className={`pt-2 ${stack('LOOSE')}`}>
                          {/* Material da atividade (enviado pelo professor) */}
                          <div className={`border-t pt-4 ${stack('DEFAULT')}`}>
                            <div className={`flex items-center ${gap('TIGHT')}`}>
                              <FileText className={`${iconSize('SM')} text-primary`} />
                              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Material da atividade
                              </span>
                            </div>
                            {activity.description && (
                              <div className="rounded-lg p-4 bg-muted/30">
                                <p className="text-sm whitespace-pre-wrap">{activity.description}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 rounded-lg p-4 bg-muted/30">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{activity.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {activity.file_type} • {((activity.file_size ?? 0) / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(activity.file_url, activity.file_name)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </Button>
                            </div>
                          </div>

                          {/* Sua entrega (arquivo/texto que o aluno enviou) */}
                          {(activity.status === "entregue" || activity.status === "corrigida") &&
                            (activity.student_response_text || (activity.student_response_file_url && activity.student_response_file_name)) && (
                            <div className="border-t pt-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-warning" />
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                  Sua entrega
                                </span>
                              </div>
                              {activity.student_response_text && (
                                <div className="rounded-lg p-4 bg-muted/30">
                                  <p className="text-sm whitespace-pre-wrap">{activity.student_response_text}</p>
                                </div>
                              )}
                              {activity.student_response_file_url && activity.student_response_file_name && (
                                <div className="flex items-center gap-4 rounded-lg p-4 bg-muted/30">
                                  <File className="h-5 w-5 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{activity.student_response_file_name}</p>
                                    <p className="text-xs text-muted-foreground">Arquivo que você enviou</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleViewFile(activity.student_response_file_url!)}
                                      title="Visualizar na web"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleDownload(activity.student_response_file_url!, activity.student_response_file_name!)
                                      }
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Baixar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Feedback/Correção do professor */}
                          {activity.status === "corrigida" &&
                            (activity.feedback ||
                              activity.grade != null ||
                              (activity.correction_file_url && activity.correction_file_name)) && (
                            <div className="border-t pt-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-success" />
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                  Feedback do professor
                                </span>
                              </div>
                              {activity.grade != null && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">Nota:</span>
                                  <span className="text-sm font-semibold tabular-nums">{Number(activity.grade).toFixed(1)}</span>
                                  <span className="text-xs text-muted-foreground">/ 10</span>
                                </div>
                              )}
                              {activity.feedback && (
                                <div className="rounded-lg p-4 bg-muted/30">
                                  <p className="text-sm whitespace-pre-wrap">{activity.feedback}</p>
                                </div>
                              )}
                              {activity.correction_file_url && activity.correction_file_name && (
                                <div className="flex items-center gap-4 rounded-lg p-4 bg-muted/30">
                                  <File className="h-5 w-5 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{activity.correction_file_name}</p>
                                    <p className="text-xs text-muted-foreground">Arquivo de correção</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleViewFile(activity.correction_file_url!)}
                                      title="Visualizar na web"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleDownload(activity.correction_file_url!, activity.correction_file_name!)
                                      }
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Baixar
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {activity.corrected_at && (
                                <p className="text-xs text-muted-foreground">
                                  Corrigida em {format(new Date(activity.corrected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Botão Entregar (no final do Ver mais, 100% largura) */}
                          {activity.status === "enviada" && (
                            <div className="pt-2">
                              <Button
                                className="w-full"
                                onClick={() => handleOpenDeliverDialog(activity)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Entregar atividade
                              </Button>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>

                      {/* Linha + Ver mais / Ver menos (sempre no final do card, linha acompanha o botão) */}
                      <div className="pt-2 border-t">
                        <CollapsibleTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
                          >
                            {expandedId === activity.id ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Ver menos
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Ver mais
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </div>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      )}

      {/* Dialog de Entrega */}
      {selectedActivity && (
        <DeliverActivityDialog
          open={deliverDialogOpen}
          onOpenChange={setDeliverDialogOpen}
          onDeliver={handleDeliverActivity}
          activityTitle={selectedActivity.title}
        />
      )}
    </PageContainer>
  );
};

export default StudentActivitiesPage;
