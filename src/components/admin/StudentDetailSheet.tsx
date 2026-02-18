import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDetailSheet } from "@/components/ui/custom/BaseDetailSheet";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  BookOpen,
  TrendingUp,
  MapPin,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  File,
  MessageSquare,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { StudentStatementTab } from "@/components/student/StudentStatementTab";
import { ClassHistoryList } from "@/components/classes/ClassHistoryList";
import { useActivities, getActivityFileUrl, useAddActivityCorrection, uploadActivityFile, getActivityDisplayStatus, formatActivityDueDate, type ActivityWithRelations } from "@/hooks/useActivities";
import { toast } from "sonner";
import { sanitizeHtml, sanitizeText, escapeHtml } from "@/lib/utils/sanitize";

interface StudentDetailSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando preenchido (ex.: professor), filtra atividades só desse professor; senão mostra todas do aluno. */
  teacherId?: string | null;
}

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  google: "Google",
  instagram: "Instagram",
  passante: "Passante",
  outro: "Outro",
};

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

/** Formulário de correção inline dentro do card expansivo */
function ActivityCorrectionFormInline({
  activity,
  onSuccess,
}: {
  activity: ActivityWithRelations;
  onSuccess: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const addCorrection = useAddActivityCorrection();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CorrectionFormData>({
    resolver: zodResolver(correctionSchema),
    defaultValues: { feedback: "", grade: "" },
  });

  const handleCorrectionSubmit = async (data: CorrectionFormData) => {
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
    onSuccess();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("correctionFile", file);
    }
  };

  const isPending = addCorrection.isPending;

  return (
    <form onSubmit={handleSubmit(handleCorrectionSubmit, (err) => toast.error(err.feedback?.message ?? err.grade?.message ?? "Preencha o feedback e a nota."))} className="space-y-4 border-t pt-4 mt-4">
      <p className="text-sm font-medium">Correção e feedback</p>
      <div className="space-y-2">
        <Label htmlFor={`feedback-${activity.id}`}>Feedback</Label>
        <Textarea
          id={`feedback-${activity.id}`}
          placeholder="Escreva sua correção, observações..."
          rows={3}
          {...register("feedback")}
          disabled={isPending}
          className="resize-none"
        />
        {errors.feedback && <p className="text-sm text-destructive">{errors.feedback.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`grade-${activity.id}`}>Nota (0–10) *</Label>
        <Input
          id={`grade-${activity.id}`}
          type="text"
          placeholder="Ex: 8.5"
          {...register("grade")}
          disabled={isPending}
        />
        {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`correctionFile-${activity.id}`}>Arquivo de correção (opcional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id={`correctionFile-${activity.id}`}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            onChange={handleFileChange}
            disabled={isPending}
            className="cursor-pointer text-sm"
          />
          {selectedFile && <span className="text-xs text-muted-foreground truncate max-w-[140px]">{selectedFile.name}</span>}
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full border-none bg-success-action text-white hover:bg-success-action/90">
        {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="h-4 w-4 mr-2" />Enviar correção</>}
      </Button>
    </form>
  );
}

export function StudentDetailSheet({
  studentId,
  open,
  onOpenChange,
  teacherId = null,
}: StudentDetailSheetProps) {
  const { data: student, isLoading } = useStudentDetails(studentId);
  const { data: activities = [], isLoading: activitiesLoading, refetch: refetchActivities } = useActivities(
    teacherId ?? undefined,
    studentId ?? undefined
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusLabel = (a: ActivityWithRelations | null) => (a ? getActivityDisplayStatus(a).label : "");
  const getStatusVariant = (a: ActivityWithRelations | null) => (a ? getActivityDisplayStatus(a).variant : "default");

  const handleActivityDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getActivityFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível abrir o arquivo.");
    }
  };

  return (
    <BaseDetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isLoading ? "" : student?.name || ""}
      subtitle={
        isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <StatusBadge variant={student?.status === "ativo" ? "success" : "default"}>
            {student?.status === "ativo" ? "Ativo" : "Inativo"}
          </StatusBadge>
        )
      }
      size="LG"
      noScroll={true}
    >
      {isLoading ? (
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : student ? (
        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid grid-cols-4">
              <TabsTrigger value="info" className="text-xs">
                <User className="h-3.5 w-3.5 mr-1.5" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="classes" className="text-xs">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Aulas
              </TabsTrigger>
              <TabsTrigger value="activities" className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Atividades
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs">
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Financeiro
              </TabsTrigger>
            </TabsList>

            {/* Dados Pessoais */}
            <TabsContent value="info" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {(() => {
                    const hourlyRate = student.hourly_rate;
                    const classesPerWeek = student.classes_per_week;
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
                    const monthlyFromCharges =
                      student.financialRecords?.reduce((sum, r) => {
                        if (r.due_date == null || r.amount == null) return sum;
                        const [y, m] = r.due_date.split("-");
                        if (y !== String(currentYear) || m !== currentMonth) return sum;
                        return sum + Number(r.amount);
                      }, 0) ?? 0;
                    const monthlyTotal =
                      monthlyFromCharges > 0
                        ? monthlyFromCharges
                        : hourlyRate != null && classesPerWeek != null
                          ? hourlyRate * classesPerWeek * 4
                          : null;
                    const payDay = student.pay_day;
                    const city = student.city;
                    const state = student.state;
                    const createdAt = student.created_at;
                    const updatedAt = student.updated_at;

                    return (
                      <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                              <TrendingUp className="h-4 w-4" />
                              Frequência
                            </div>
                            <p className="text-2xl font-bold">
                              {student.stats.attendanceRate.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.stats.presentClasses}/{student.stats.totalClasses} aulas
                            </p>
                          </div>
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                              <BookOpen className="h-4 w-4" />
                              Média
                            </div>
                            <p className="text-2xl font-bold">
                              {student.stats.averageGrade > 0
                                ? student.stats.averageGrade.toFixed(1)
                                : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">Nota geral</p>
                          </div>
                        </div>

                        {/* Informações Pessoais */}
                        <div className="space-y-4 mt-4">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Informações Pessoais
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">CPF</p>
                                <p className="text-sm font-medium">{student.cpf || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-sm font-medium">{student.email || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Telefone</p>
                                <p className="text-sm font-medium">{student.phone || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                                <p className="text-sm font-medium">
                                  {student.birth_date ? formatDate(student.birth_date) : "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Localização */}
                        <div className="space-y-3 mt-4">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Localização
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {state && state.length === 2 ? "Cidade / UF" : "Cidade / País"}
                              </p>
                              <p className="text-sm font-medium">
                                {city || state
                                  ? `${city || "—"}${state ? ` - ${state}` : ""}`
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Informações de Aula / Financeiro */}
                        <div className="space-y-3 mt-4">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Plano de aulas e cobrança
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-xs text-muted-foreground mb-1">Valor por hora</p>
                              <p className="text-sm font-semibold">
                                {hourlyRate != null ? formatCurrency(hourlyRate) : "—"}
                              </p>
                            </div>
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-xs text-muted-foreground mb-1">Aulas por semana</p>
                              <p className="text-sm font-semibold">
                                {classesPerWeek != null ? classesPerWeek : "—"}
                              </p>
                            </div>
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-xs text-muted-foreground mb-1">Total mensal</p>
                              <p className="text-sm font-semibold">
                                {monthlyTotal != null ? formatCurrency(monthlyTotal) : "—"}
                              </p>
                            </div>
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-xs text-muted-foreground mb-1">Dia de pagamento</p>
                              <p className="text-sm font-semibold">
                                {payDay != null ? payDay : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Datas de cadastro */}
                        <div className="space-y-1 mt-4 text-xs text-muted-foreground">
                          {createdAt && (
                            <p>Cadastro em {formatDate(createdAt)}</p>
                          )}
                          {updatedAt && (
                            <p>Última edição em {formatDate(updatedAt)}</p>
                          )}
                        </div>

                        {/* Origem */}
                        <div className="space-y-2 mt-6">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Origem
                          </h3>
                          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">
                            {student.origin
                              ? originLabels[student.origin] || student.origin
                              : "Não informado"}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aulas */}
            <TabsContent value="classes" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold">{student.stats.totalClasses}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="rounded-lg bg-success/10 p-3 text-center">
                      <p className="text-lg font-bold text-success">
                        {student.stats.presentClasses}
                      </p>
                      <p className="text-xs text-muted-foreground">Presenças</p>
                    </div>
                    <div className="rounded-lg bg-rose-500/10 p-3 text-center">
                      <p className="text-lg font-bold text-rose-600">
                        {student.stats.totalClasses - student.stats.presentClasses}
                      </p>
                      <p className="text-xs text-muted-foreground">Faltas</p>
                    </div>
                  </div>

                  {/* Class List */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Histórico de Aulas
                    </h3>
                    <ClassHistoryList
                      classLogs={student.classLogs.map((log) => ({
                        id: log.id,
                        class_date: log.class_date,
                        start_at: log.start_at,
                        end_at: log.end_at,
                        duration_minutes: log.duration_minutes,
                        attendance: log.attendance,
                        grade: log.grade ?? null,
                        title: log.title ?? null,
                        feedback: log.feedback ?? null,
                        // Fallback para teacher_name: do log, senão do aluno
                        teacher_name: log.teacher_name || student.teacher_name || undefined,
                        // Fallback para amount: billed_amount, senão 0
                        amount: typeof log.billed_amount === 'number' ? log.billed_amount : null,
                      }))}
                      emptyMessage="Nenhuma aula registrada"
                      groupByMonth={true}
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Atividades — cards expansivos (padrão aulas) */}
            <TabsContent value="activities" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Atividades do aluno
                  </h3>
                  {activitiesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      Nenhuma atividade enviada.
                    </p>
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
                                  <span>Enviada em {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                                {activity.due_date && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Prazo: {formatActivityDueDate(activity.due_date)}</span>
                                  </div>
                                )}

                                <CollapsibleContent>
                                  <div className="pt-2 space-y-4">
                                    {/* Material */}
                                    <div className="border-t pt-4 space-y-3">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Material</span>
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
                                          <Download className="h-4 w-4 mr-2" />
                                          Baixar
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Resposta do aluno */}
                                    {(activity.status === "entregue" || activity.status === "corrigida") &&
                                      (activity.student_response_text || (activity.student_response_file_url && activity.student_response_file_name)) && (
                                      <div className="border-t pt-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                          <File className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resposta do aluno</span>
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
                                              <Download className="h-4 w-4 mr-2" />
                                              Baixar
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
                                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</span>
                                        </div>
                                        {activity.grade != null && (
                                          <p className="text-sm">Nota: <span className="font-semibold">{Number(activity.grade).toFixed(1)}</span>/10</p>
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
                                              <Download className="h-4 w-4 mr-2" />
                                              Baixar
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Formulário de correção (quando status = entregue) */}
                                    {activity.status === "entregue" && (
                                      <ActivityCorrectionFormInline activity={activity} onSuccess={refetchActivities} />
                                    )}
                                  </div>
                                </CollapsibleContent>

                                <div className="pt-2 border-t">
                                  <CollapsibleTrigger asChild>
                                    <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
                                      {expandedId === activity.id ? (
                                        <><ChevronUp className="h-4 w-4" /> Ver menos</>
                                      ) : (
                                        <><ChevronDown className="h-4 w-4" /> Ver mais</>
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
            </TabsContent>

            {/* Financeiro */}
            <TabsContent value="financial" className="flex-1 overflow-auto m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Cards coloridos */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-success/10 p-3 text-center">
                      <p className="text-sm font-bold text-success">
                        {formatCurrency(student.stats.totalPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground">Pago</p>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 p-3 text-center">
                      <p className="text-sm font-bold text-amber-600">
                        {formatCurrency(student.stats.totalPending)}
                      </p>
                      <p className="text-xs text-muted-foreground">Pendente</p>
                    </div>
                    <div className="rounded-lg bg-rose-500/10 p-3 text-center">
                      <p className="text-sm font-bold text-rose-600">
                        {formatCurrency(student.stats.totalOverdue)}
                      </p>
                      <p className="text-xs text-muted-foreground">Atrasado</p>
                    </div>
                  </div>

                  {/* Timeline com cobranças integradas */}
                  <StudentStatementTab
                    studentId={student.id}
                    studentName={student.name}
                    embedded={true}
                    totalAmount={
                      student.stats.totalPaid +
                      student.stats.totalPending +
                      student.stats.totalOverdue
                    }
                  />
                </div>
              </ScrollArea>
            </TabsContent>

          </Tabs>
      ) : (
        <div className="p-6 text-center text-muted-foreground">
          Aluno não encontrado
        </div>
      )}
    </BaseDetailSheet>
  );
}
