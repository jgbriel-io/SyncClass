import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Download,
  FileText,
  Check,
  ChatCircle as MessageSquare,
  File,
  Eye,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  User,
  Calendar,
  Clock,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { typography } from "@/lib/design-tokens/typography";
import { stack, gap } from "@/lib/design-tokens/spacing";
import { iconSize } from "@/lib/design-tokens/icon-sizes";
import {
  getActivityDisplayStatus,
  formatActivityDueDate,
  type ActivityWithRelations,
} from "@/hooks/useActivities";
import { studentPortal } from "@/content";

interface StudentActivityCardProps {
  activity: ActivityWithRelations;
  onViewFile: (filePath: string) => void;
  onDownload: (filePath: string, fileName: string) => void;
  onDeliver: (activity: ActivityWithRelations) => void;
}

export function StudentActivityCard({
  activity,
  onViewFile,
  onDownload,
  onDeliver,
}: StudentActivityCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className="p-4 overflow-hidden">
        <div className={`flex items-start justify-between ${gap("LOOSE")}`}>
          <div className={`${stack("DEFAULT")} flex-1 min-w-0`}>
            {/* Título + Badge */}
            <div
              className={`flex items-center justify-between ${gap("DEFAULT")}`}
            >
              <h3 className={`${typography("BODY_SEMIBOLD")} truncate min-w-0`}>
                {activity.title}
              </h3>
              <StatusBadge
                variant={getActivityDisplayStatus(activity).variant}
                className="shrink-0"
              >
                {getActivityDisplayStatus(activity).label}
              </StatusBadge>
            </div>

            {/* Informações com ícones */}
            <div
              className={`flex items-center ${gap("TIGHT")} ${typography("SMALL")}`}
            >
              <User className={`${iconSize("SM")} flex-shrink-0`} />
              <span>
                {studentPortal.activities.teacherLabel(
                  activity.teachers?.name || "—"
                )}
              </span>
            </div>
            <div
              className={`flex items-center ${gap("TIGHT")} ${typography("SMALL")}`}
            >
              <Calendar className={`${iconSize("SM")} flex-shrink-0`} />
              <span>
                {studentPortal.activities.sentAt(
                  format(
                    new Date(activity.created_at),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )
                )}
              </span>
            </div>
            {activity.due_date && (
              <div
                className={`flex items-center ${gap("TIGHT")} ${typography("SMALL")}`}
              >
                <Clock className={`${iconSize("SM")} flex-shrink-0`} />
                <span>
                  {studentPortal.activities.dueDate(
                    formatActivityDueDate(activity.due_date)
                  )}
                </span>
              </div>
            )}
            {activity.delivered_at && (
              <div
                className={`flex items-center ${gap("TIGHT")} ${typography("SMALL")}`}
              >
                <Clock className={`${iconSize("SM")} flex-shrink-0`} />
                <span>
                  {studentPortal.activities.deliveredAt(
                    format(
                      new Date(activity.delivered_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )
                  )}
                </span>
              </div>
            )}

            {/* Conteúdo expandido */}
            <CollapsibleContent>
              <div className={`pt-2 ${stack("LOOSE")}`}>
                {/* Material da atividade */}
                <div className={`border-t pt-4 ${stack("DEFAULT")}`}>
                  <div className={`flex items-center ${gap("TIGHT")}`}>
                    <FileText className={`${iconSize("SM")} text-primary`} />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {studentPortal.activities.materialSection}
                    </span>
                  </div>
                  {activity.description && (
                    <div className="rounded-lg p-4 bg-muted/30">
                      <p className="text-sm whitespace-pre-wrap">
                        {activity.description}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 rounded-lg p-4 bg-muted/30">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.file_type} •{" "}
                        {((activity.file_size ?? 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewFile(activity.file_url)}
                        title={studentPortal.activities.viewFileTitle}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onDownload(activity.file_url, activity.file_name)
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {studentPortal.activities.downloadButton}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Entrega do aluno */}
                {(activity.status === "entregue" ||
                  activity.status === "corrigida") &&
                  (activity.student_response_text ||
                    (activity.student_response_file_url &&
                      activity.student_response_file_name)) && (
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {studentPortal.activities.deliverySection}
                        </span>
                      </div>
                      {activity.student_response_text && (
                        <div className="rounded-lg p-4 bg-muted/30">
                          <p className="text-sm whitespace-pre-wrap">
                            {activity.student_response_text}
                          </p>
                        </div>
                      )}
                      {activity.student_response_file_url &&
                        activity.student_response_file_name && (
                          <div className="flex items-center gap-4 rounded-lg p-4 bg-muted/30">
                            <File className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {activity.student_response_file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {studentPortal.activities.uploadedFileLabel}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  onViewFile(
                                    activity.student_response_file_url!
                                  )
                                }
                                title={studentPortal.activities.viewFileTitle}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onDownload(
                                    activity.student_response_file_url!,
                                    activity.student_response_file_name!
                                  )
                                }
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {studentPortal.activities.downloadButton}
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                {/* Feedback do professor */}
                {activity.status === "corrigida" &&
                  (activity.feedback ||
                    activity.grade != null ||
                    (activity.correction_file_url &&
                      activity.correction_file_name)) && (
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {studentPortal.activities.feedbackSection}
                        </span>
                      </div>
                      {activity.grade != null && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {studentPortal.activities.gradeLabel}
                          </span>
                          <span className="text-sm font-semibold tabular-nums">
                            {Number(activity.grade).toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {studentPortal.activities.gradeOutOf}
                          </span>
                        </div>
                      )}
                      {activity.feedback && (
                        <div className="rounded-lg p-4 bg-muted/30">
                          <p className="text-sm whitespace-pre-wrap">
                            {activity.feedback}
                          </p>
                        </div>
                      )}
                      {activity.correction_file_url &&
                        activity.correction_file_name && (
                          <div className="flex items-center gap-4 rounded-lg p-4 bg-muted/30">
                            <File className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {activity.correction_file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {studentPortal.activities.correctionFileLabel}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  onViewFile(activity.correction_file_url!)
                                }
                                title={studentPortal.activities.viewFileTitle}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onDownload(
                                    activity.correction_file_url!,
                                    activity.correction_file_name!
                                  )
                                }
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {studentPortal.activities.downloadButton}
                              </Button>
                            </div>
                          </div>
                        )}
                      {activity.corrected_at && (
                        <p className="text-xs text-muted-foreground">
                          {studentPortal.activities.correctedAt(
                            format(
                              new Date(activity.corrected_at),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )
                          )}
                        </p>
                      )}
                    </div>
                  )}

                {/* Botão Entregar */}
                {activity.status === "enviada" && (
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      onClick={() => onDeliver(activity)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {studentPortal.activities.deliverButton}
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>

            {/* Ver mais / Ver menos */}
            <div className="pt-2 border-t">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      {studentPortal.activities.viewLess}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {studentPortal.activities.viewMore}
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </div>
      </Card>
    </Collapsible>
  );
}
