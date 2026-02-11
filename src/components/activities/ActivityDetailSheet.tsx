import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileText, Download, MessageSquare, File, Edit, Loader2, Upload, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAddActivityCorrection, uploadActivityFile, getActivityFileUrl, type ActivityWithRelations } from "@/hooks/useActivities";
import { toast } from "sonner";

const correctionSchema = z
  .object({
    feedback: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Informe o feedback")),
    grade: z.string().min(1, "Informe a nota (0–10)"),
    correctionFile: z.any().optional(),
  })
  .refine(
    (data) => {
      const g = data.grade?.trim();
      if (!g) return false;
      const n = parseFloat(g.replace(",", "."));
      return !Number.isNaN(n) && n >= 0 && n <= 10;
    },
    { message: "Informe a nota (0–10)", path: ["grade"] }
  );

type CorrectionFormData = z.infer<typeof correctionSchema>;

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const addCorrection = useAddActivityCorrection();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CorrectionFormData>({
    resolver: zodResolver(correctionSchema),
    defaultValues: { feedback: "", grade: "" },
  });

  useEffect(() => {
    if (open && activity && initialCorrectionMode && activity.status === "entregue") {
      setShowCorrectionForm(true);
    }
  }, [open, activity, initialCorrectionMode]);

  useEffect(() => {
    if (!open) {
      setShowCorrectionForm(false);
      setSelectedFile(null);
      reset();
    }
  }, [open, reset]);

  const handleCorrectionSubmit = async (data: CorrectionFormData) => {
    if (!activity) return;
    setIsSubmittingCorrection(true);
    try {
      let correctionFileUrl: string | undefined;
      let correctionFileName: string | undefined;
      const file = data.correctionFile;
      if (file != null && typeof file === "object" && "name" in file && typeof (file as { name: string }).name === "string") {
        const { url } = await uploadActivityFile(file as File);
        correctionFileUrl = url;
        correctionFileName = (file as File).name;
      }
      const gradeValue = data.grade?.trim()
        ? Math.min(10, Math.max(0, parseFloat(data.grade.replace(",", ".")) || 0))
        : null;
      await addCorrection.mutateAsync({
        activityId: activity.id,
        feedback: data.feedback.trim(),
        grade: gradeValue,
        correctionFileUrl,
        correctionFileName,
      });
      toast.success("Correção enviada.");
      reset();
      setSelectedFile(null);
      setShowCorrectionForm(false);
      onCorrectionSuccess?.();
    } catch (error) {
      toast.error("Erro ao enviar correção: " + (error as Error).message);
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("correctionFile", file);
    }
  };

  const handleViewFile = async (filePath: string) => {
    try {
      const url = await getActivityFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Não foi possível abrir o arquivo.");
    }
  };

  const isCorrectionPending = isSubmittingCorrection || addCorrection.isPending;

  if (!activity) return null;

  const hasStudentResponse =
    activity.student_response_text || activity.student_response_file_url;
  const showCorrectionFormArea = activity.status === "entregue" && (showCorrectionForm || initialCorrectionMode);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-left space-y-1">
            <p className="font-semibold">{activity.title}</p>
            <p className="text-sm font-normal text-muted-foreground">
              {activity.students?.name}
            </p>
            <StatusBadge variant={getStatusVariant(activity)}>
              {getStatusLabel(activity)}
            </StatusBadge>
          </SheetTitle>
        </SheetHeader>

        <div className="w-full max-h-full self-start overflow-auto px-6 py-3">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Data de envio
              </p>
              <p className="text-sm text-foreground">
                {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>

            {activity.due_date && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Prazo de entrega
                </p>
                <p className="text-sm text-foreground">
                  {format(new Date(activity.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}

            {activity.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Descrição
                </p>
                <p className="text-sm whitespace-pre-wrap text-foreground">
                  {activity.description}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Arquivo da atividade
              </p>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate flex-1 min-w-0">
                  {activity.file_name}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewFile(activity.file_url)}
                    title="Visualizar na web"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(activity.file_url, activity.file_name)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                </div>
              </div>
            </div>

            {(activity.status === "entregue" || activity.status === "corrigida") &&
              hasStudentResponse && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Resposta do aluno
                  </p>
                  {activity.student_response_text && (
                    <div className="rounded-lg border bg-muted/30 p-4 mb-3">
                      <p className="text-sm whitespace-pre-wrap text-foreground">
                        {activity.student_response_text}
                      </p>
                    </div>
                  )}
                  {activity.student_response_file_url &&
                    activity.student_response_file_name && (
                      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                        <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate flex-1 min-w-0">
                          {activity.student_response_file_name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewFile(activity.student_response_file_url || "")}
                            title="Visualizar na web"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onDownload(
                                activity.student_response_file_url || "",
                                activity.student_response_file_name || ""
                              )
                            }
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    )}
                  {activity.delivered_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Entregue em{" "}
                      {format(
                        new Date(activity.delivered_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </p>
                  )}
                </div>
              )}

            {activity.status === "corrigida" &&
              (activity.feedback ||
                activity.grade != null ||
                (activity.correction_file_url && activity.correction_file_name)) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Feedback / Correção
                </p>
                {activity.grade != null && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Nota:</span>
                    <span className="text-sm font-semibold tabular-nums">{Number(activity.grade).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">/ 10</span>
                  </div>
                )}
                {activity.feedback && (
                  <div className="rounded-lg border bg-muted/30 p-4 mb-3">
                    <p className="text-sm whitespace-pre-wrap text-foreground">
                      {activity.feedback}
                    </p>
                  </div>
                )}
                {activity.correction_file_url && activity.correction_file_name && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate flex-1 min-w-0">
                      {activity.correction_file_name}
                    </span>
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
                          onDownload(activity.correction_file_url!, activity.correction_file_name!)
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                )}
                {activity.corrected_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Corrigida em{" "}
                    {format(
                      new Date(activity.corrected_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {activity.status === "entregue" && (
          <div className="px-6 py-3 space-y-4">
            {showCorrectionFormArea ? (
              <form
                onSubmit={handleSubmit(handleCorrectionSubmit, (errors) => {
                  const msg = errors.feedback?.message ?? errors.grade?.message ?? "Preencha o feedback e a nota para enviar a correção.";
                  toast.error(msg);
                })}
                className="space-y-4"
              >
                <p className="text-sm font-medium">Correção e feedback</p>
                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Escreva sua correção, observações, elogios..."
                    rows={4}
                    {...register("feedback")}
                    disabled={isCorrectionPending}
                    className="resize-none"
                  />
                  {errors.feedback && (
                    <p className="text-sm text-destructive">{errors.feedback.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Nota (0–10) *</Label>
                  <Input
                    id="grade"
                    type="text"
                    placeholder="Ex: 8.5"
                    {...register("grade")}
                    disabled={isCorrectionPending}
                  />
                  {errors.grade && (
                    <p className="text-sm text-destructive">{errors.grade.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correctionFile">Arquivo de correção (opcional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="correctionFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={handleFileChange}
                      disabled={isCorrectionPending}
                      className="cursor-pointer text-sm"
                    />
                    {selectedFile && (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {selectedFile.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!initialCorrectionMode && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={isCorrectionPending}
                      onClick={() => {
                        setShowCorrectionForm(false);
                        setSelectedFile(null);
                        reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isCorrectionPending}
                    className={initialCorrectionMode ? "w-full" : "flex-1 border-none bg-[#25D366] text-white hover:bg-[#1ebe57]"}
                  >
                    {isCorrectionPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar correção
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                className="w-full h-10 border-none bg-[#25D366] text-white hover:bg-[#1ebe57]"
                onClick={() => setShowCorrectionForm(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Corrigir atividade
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
