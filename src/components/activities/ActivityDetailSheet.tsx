import { useState, useEffect } from "react";
import { BaseDetailSheet } from "@/components/ui/custom/BaseDetailSheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileText, Download, MessageSquare, File, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getActivityFileUrl, type ActivityWithRelations } from "@/hooks/useActivities";
import { ActivityCorrectionFormInline } from "@/components/activities/ActivityCorrectionFormInline";
import { toast } from "sonner";
import { sanitizeHtml, sanitizeText } from "@/lib/utils/sanitize";

interface ActivityDetailSheetProps {
  activity: ActivityWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (filePath: string, fileName: string) => void;
  getStatusLabel: (activity: ActivityWithRelations | null) => string;
  getStatusVariant: (activity: ActivityWithRelations | null) => "success" | "warning" | "default" | "info" | "destructive";
  /** Abre o sheet já com o formulário de correção visível (ex.: ao clicar em Corrigir na tabela) */
  initialCorrectionMode?: boolean;
  /** Chamado após enviar a correção com sucesso (ex.: refetch + atualizar atividade) */
  onCorrectionSuccess?: () => void;
}

export function ActivityDetailSheet({
  activity,
  open,
  onOpenChange,
  onDownload,
  getStatusLabel,
  getStatusVariant,
  initialCorrectionMode = false,
  onCorrectionSuccess,
}: ActivityDetailSheetProps) {
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  useEffect(() => {
    if (open && activity && initialCorrectionMode && activity.status === "entregue") {
      setShowCorrectionForm(true);
    }
  }, [open, activity, initialCorrectionMode]);

  useEffect(() => {
    if (!open) setShowCorrectionForm(false);
  }, [open]);

  const handleViewFile = async (filePath: string) => {
    try {
      const url = await getActivityFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível abrir o arquivo.");
    }
  };

  if (!activity) return null;

  const hasStudentResponse = activity.student_response_text || activity.student_response_file_url;
  const showCorrectionFormArea = activity.status === "entregue" && (showCorrectionForm || initialCorrectionMode);

  return (
    <BaseDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={activity.title}
      subtitle={
        <>
          <p className="text-sm font-normal text-muted-foreground">{activity.students?.name}</p>
          <StatusBadge variant={getStatusVariant(activity)}>{getStatusLabel(activity)}</StatusBadge>
        </>
      }
      size="DEFAULT"
      noScroll={true}
    >
      <div className="w-full max-h-full self-start overflow-auto px-6 py-3">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Data de envio</p>
            <p className="text-sm text-foreground">{format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>

          {activity.due_date && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Prazo de entrega</p>
              <p className="text-sm text-foreground">{format(new Date(activity.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          )}

          {activity.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Descrição</p>
              <div className="text-sm whitespace-pre-wrap text-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.description) }} />
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Arquivo da atividade</p>
            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate flex-1 min-w-0">{activity.file_name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewFile(activity.file_url)} title="Visualizar na web">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDownload(activity.file_url, activity.file_name)}>
                  <Download className="h-4 w-4 mr-1" />Baixar
                </Button>
              </div>
            </div>
          </div>

          {(activity.status === "entregue" || activity.status === "corrigida") && hasStudentResponse && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Resposta do aluno</p>
              {activity.student_response_text && (
                <div className="rounded-lg border bg-muted/30 p-4 mb-3">
                  <p className="text-sm whitespace-pre-wrap text-foreground">{sanitizeText(activity.student_response_text)}</p>
                </div>
              )}
              {activity.student_response_file_url && activity.student_response_file_name && (
                <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate flex-1 min-w-0">{activity.student_response_file_name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewFile(activity.student_response_file_url || "")} title="Visualizar na web">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDownload(activity.student_response_file_url || "", activity.student_response_file_name || "")}>
                      <Download className="h-4 w-4 mr-1" />Baixar
                    </Button>
                  </div>
                </div>
              )}
              {activity.delivered_at && (
                <p className="text-xs text-muted-foreground mt-2">Entregue em {format(new Date(activity.delivered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              )}
            </div>
          )}

          {activity.status === "corrigida" && (activity.feedback || activity.grade != null || (activity.correction_file_url && activity.correction_file_name)) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />Feedback / Correção
              </p>
              {activity.grade != null && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Nota:</span>
                  <span className="text-sm font-semibold tabular-nums">{Number(activity.grade).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              )}
              {activity.feedback && (
                <div className="rounded-lg border bg-muted/30 p-4 mb-3">
                  <p className="text-sm whitespace-pre-wrap text-foreground">{sanitizeText(activity.feedback)}</p>
                </div>
              )}
              {activity.correction_file_url && activity.correction_file_name && (
                <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate flex-1 min-w-0">{activity.correction_file_name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewFile(activity.correction_file_url!)} title="Visualizar na web">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDownload(activity.correction_file_url!, activity.correction_file_name!)}>
                      <Download className="h-4 w-4 mr-1" />Baixar
                    </Button>
                  </div>
                </div>
              )}
              {activity.corrected_at && (
                <p className="text-xs text-muted-foreground mt-2">Corrigida em {format(new Date(activity.corrected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {activity.status === "entregue" && (
        <div className="px-6 py-3 space-y-4">
          {showCorrectionFormArea ? (
            <ActivityCorrectionFormInline
              activity={activity}
              onSuccess={() => {
                setShowCorrectionForm(false);
                onCorrectionSuccess?.();
              }}
              onCancel={!initialCorrectionMode ? () => setShowCorrectionForm(false) : undefined}
            />
          ) : (
            <Button className="w-full h-10 border-none bg-success-action text-white hover:bg-success-action/90" onClick={() => setShowCorrectionForm(true)}>
              <Edit className="h-4 w-4 mr-2" />Corrigir atividade
            </Button>
          )}
        </div>
      )}
    </BaseDetailSheet>
  );
}
