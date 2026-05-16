import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/ui/status-badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar, ChevronDown, ChevronUp, Download, File, FileText, Loader2, MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getActivityFileUrl, getActivityDisplayStatus, formatActivityDueDate, type ActivityWithRelations } from "@/hooks/useActivities";
import { ActivityCorrectionFormInline } from "@/components/activities/ActivityCorrectionFormInline";
import { sanitizeHtml, sanitizeText, escapeHtml } from "@/lib/utils/sanitize";
import { toast } from "sonner";
import { activities as activitiesContent, common } from "@/content";

interface StudentDetailActivitiesTabProps {
  activities: ActivityWithRelations[];
  activitiesLoading: boolean;
  onRefetch: () => void;
}

export function StudentDetailActivitiesTab({ activities, activitiesLoading, onRefetch }: StudentDetailActivitiesTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleActivityDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getActivityFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(activitiesContent.view.toasts.fileOpenError);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">{common.labels.noActivities}</h3>

        {activitiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{common.labels.noActivities}</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Collapsible
                key={activity.id}
                open={expandedId === activity.id}
                onOpenChange={(open) => setExpandedId(open ? activity.id : null)}
              >
                <Card className="p-4 overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-semibold text-sm text-foreground truncate min-w-0">
                          {escapeHtml(activity.title)}
                        </h3>
                        <StatusBadge variant={getActivityDisplayStatus(activity).variant} className="shrink-0">
                          {getActivityDisplayStatus(activity).label}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{common.labels.sentAt} {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      {activity.due_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{common.labels.dueAt}: {formatActivityDueDate(activity.due_date)}</span>
                        </div>
                      )}

                      <CollapsibleContent>
                        <div className="pt-2 space-y-4">
                          {/* Material */}
                          <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{common.labels.material}</span>
                            </div>
                            {activity.description && (
                              <div className="rounded-lg p-3 bg-muted/30">
                                <div
                                  className="text-sm whitespace-pre-wrap prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.description) }}
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-4 rounded-lg p-3 bg-muted/30">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{activity.file_name}</p>
                                {activity.file_size != null && (
                                  <p className="text-xs text-muted-foreground">{(activity.file_size / 1024).toFixed(1)} KB</p>
                                )}
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleActivityDownload(activity.file_url, activity.file_name)}>
                                <Download className="h-4 w-4 mr-2" />{common.buttons.download}
                              </Button>
                            </div>
                          </div>

                          {/* Resposta do aluno */}
                          {(activity.status === "entregue" || activity.status === "corrigida") &&
                            (activity.student_response_text || (activity.student_response_file_url && activity.student_response_file_name)) && (
                            <div className="border-t pt-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{common.labels.studentResponse}</span>
                              </div>
                              {activity.student_response_text && (
                                <div className="rounded-lg p-3 bg-muted/30">
                                  <p className="text-sm whitespace-pre-wrap">{sanitizeText(activity.student_response_text)}</p>
                                </div>
                              )}
                              {activity.student_response_file_url && activity.student_response_file_name && (
                                <div className="flex items-center gap-4 rounded-lg p-3 bg-muted/30">
                                  <File className="h-5 w-5 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{activity.student_response_file_name}</p>
                                  </div>
                                  <Button size="sm" variant="outline" onClick={() => handleActivityDownload(activity.student_response_file_url!, activity.student_response_file_name!)}>
                                    <Download className="h-4 w-4 mr-2" />{common.buttons.download}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Feedback já enviado */}
                          {activity.status === "corrigida" &&
                            (activity.feedback || activity.grade != null || (activity.correction_file_url && activity.correction_file_name)) && (
                            <div className="border-t pt-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-success" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{common.labels.feedback}</span>
                              </div>
                              {activity.grade != null && (
                                <p className="text-sm">{common.labels.grade}: <span className="font-semibold">{Number(activity.grade).toFixed(1)}</span>/100</p>
                              )}
                              {activity.feedback && (
                                <div className="rounded-lg p-3 bg-muted/30">
                                  <p className="text-sm whitespace-pre-wrap">{sanitizeText(activity.feedback)}</p>
                                </div>
                              )}
                              {activity.correction_file_url && activity.correction_file_name && (
                                <div className="flex items-center gap-4 rounded-lg p-3 bg-muted/30">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <span className="text-sm truncate flex-1">{activity.correction_file_name}</span>
                                  <Button size="sm" variant="outline" onClick={() => handleActivityDownload(activity.correction_file_url!, activity.correction_file_name!)}>
                                    <Download className="h-4 w-4 mr-2" />{common.buttons.download}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Formulário de correção */}
                          {activity.status === "entregue" && (
                            <ActivityCorrectionFormInline activity={activity} onSuccess={onRefetch} />
                          )}
                        </div>
                      </CollapsibleContent>

                      <div className="pt-2 border-t">
                        <CollapsibleTrigger asChild>
                          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
                            {expandedId === activity.id ? (
                              <><ChevronUp className="h-4 w-4" />{common.labels.viewLess}</>
                            ) : (
                              <><ChevronDown className="h-4 w-4" />{common.labels.viewMore}</>
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
        )}
      </div>
    </ScrollArea>
  );
}
