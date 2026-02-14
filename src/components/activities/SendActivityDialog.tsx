import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Upload, FileText, FolderOpen, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";
import { useStudents } from "@/hooks/useStudents";
import {
  useCreateActivity,
  uploadActivityFile,
  useActivityFilesForTeacher,
  ActivityInsert,
} from "@/hooks/useActivities";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/** Converte data (dd/MM/yyyy) + hora (HH:mm) para ISO no fuso local (enviado como timestamptz) */
function dueDateAndTimeToIso(dueDate: string, dueTime: string): string {
  const [day, month, year] = dueDate.split("/").map(Number);
  const [hour, minute] = dueTime.split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  return local.toISOString();
}

const activitySchema = z
  .object({
    student_id: z.string().min(1, "Selecione um aluno"),
    title: z.string().min(1, "Informe o título da atividade"),
    description: z.string().optional(),
    due_date: z.string().min(1, "Defina o prazo de entrega").regex(REGEX_PATTERNS.date, "Data no formato dd/mm/aaaa"),
    due_time: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Hora no formato HH:mm"),
    fileSource: z.enum(["new", "existing"]),
    file: z.instanceof(File).optional(),
    existingFileUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fileSource === "new") return data.file != null;
      return !!data.existingFileUrl;
    },
    { message: "Selecione ou envie um arquivo", path: ["file"] }
  );

type ActivityFormData = z.infer<typeof activitySchema>;

interface SendActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
}

export function SendActivityDialog({
  open,
  onOpenChange,
  teacherId,
}: SendActivityDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: existingFiles = [], isLoading: loadingFiles } = useActivityFilesForTeacher(teacherId);
  const createActivity = useCreateActivity();
  const activeStudents = students.filter((s) => s.status === "ativo");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      fileSource: "new",
      due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "dd/MM/yyyy", { locale: ptBR }),
      due_time: "23:59",
    },
  });

  const fileSource = watch("fileSource");
  const dueDate = watch("due_date");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("file", file);
      setValue("existingFileUrl", undefined);
    }
  };

  const handleFormSubmit = async (data: ActivityFormData) => {
    setIsUploading(true);
    try {
      let file_url: string;
      let file_name: string;
      let file_type: string | null = null;
      let file_size: number | null = null;

      if (data.fileSource === "new" && data.file) {
        const uploaded = await uploadActivityFile(data.file);
        file_url = uploaded.url;
        file_name = data.file.name;
        file_type = data.file.type;
        file_size = data.file.size;
      } else if (data.fileSource === "existing" && data.existingFileUrl) {
        const existing = existingFiles.find((f) => f.file_url === data.existingFileUrl);
        if (!existing) {
          toast.error("Arquivo não encontrado.");
          return;
        }
        file_url = existing.file_url;
        file_name = existing.file_name;
        file_type = existing.file_type;
        file_size = existing.file_size;
      } else {
        toast.error("Selecione ou envie um arquivo.");
        return;
      }

      const activityData: ActivityInsert = {
        student_id: data.student_id,
        teacher_id: teacherId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        due_date: dueDateAndTimeToIso(data.due_date, data.due_time),
        file_url,
        file_name,
        file_type,
        file_size,
        status: "enviada",
      };

      await createActivity.mutateAsync(activityData);

      reset({
        fileSource: "new",
        due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "dd/MM/yyyy", { locale: ptBR }),
        due_time: "23:59",
      });
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao enviar atividade: " + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = isUploading || createActivity.isPending;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Enviar atividade"
      description="Selecione o aluno, preencha o título e anexe o arquivo da atividade."
      size="SM"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Seleção de Aluno */}
          <div className="space-y-2">
            <Label htmlFor="student_id">Aluno *</Label>
            <Select
              onValueChange={(value) => setValue("student_id", value)}
              disabled={loadingStudents || isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {activeStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("student_id")} />
            {errors.student_id && (
              <p className="text-sm text-destructive">{errors.student_id.message}</p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Lista de Exercícios 1"
              {...register("title")}
              disabled={isPending}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Prazo de entrega (data e hora) */}
          <div className="space-y-2">
            <Label>Prazo de entrega *</Label>
            <p className="text-xs text-muted-foreground">Data e hora limite para o aluno entregar.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="due_date"
                    variant="outline"
                    className="w-full sm:flex-1 justify-start text-left font-normal"
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate || "Data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate && REGEX_PATTERNS.date.test(dueDate) ? (() => { const [d, m, y] = dueDate.split("/"); return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)); })() : undefined}
                    onSelect={(date) => {
                      if (date) setValue("due_date", format(date, "dd/MM/yyyy", { locale: ptBR }), { shouldValidate: true });
                    }}
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              <Input
                id="due_time"
                type="time"
                {...register("due_time")}
                disabled={isPending}
                className="w-full sm:w-[120px]"
              />
            </div>
            {errors.due_date && (
              <p className="text-sm text-destructive">{errors.due_date.message}</p>
            )}
            {errors.due_time && (
              <p className="text-sm text-destructive">{errors.due_time.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Instruções e observações..."
              rows={3}
              {...register("description")}
              disabled={isPending}
            />
          </div>

          {/* Arquivo: novo ou da plataforma */}
          <div className="space-y-3">
            <Label>Arquivo *</Label>
            <RadioGroup
              value={fileSource}
              onValueChange={(v) => {
                setValue("fileSource", v as "new" | "existing");
                setSelectedFile(null);
                setValue("file", undefined);
                setValue("existingFileUrl", undefined);
              }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="source-new" disabled={isPending} />
                <Label htmlFor="source-new" className="font-normal cursor-pointer flex items-center gap-1.5">
                  <Upload className="h-4 w-4" />
                  Enviar novo arquivo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="source-existing" disabled={isPending || existingFiles.length === 0} />
                <Label htmlFor="source-existing" className="font-normal cursor-pointer flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4" />
                  Usar arquivo já na plataforma
                  {existingFiles.length === 0 && (
                    <span className="text-xs text-muted-foreground">(nenhum ainda)</span>
                  )}
                </Label>
              </div>
            </RadioGroup>

            {fileSource === "new" && (
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                  </div>
                )}
              </div>
            )}

            {fileSource === "existing" && existingFiles.length > 0 && (
              <Select
                value={watch("existingFileUrl") ?? ""}
                onValueChange={(v) => setValue("existingFileUrl", v)}
                disabled={isPending || loadingFiles}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um arquivo" />
                </SelectTrigger>
                <SelectContent>
                  {existingFiles.map((f) => (
                    <SelectItem key={f.file_url} value={f.file_url}>
                      <span className="truncate block max-w-[240px]">
                        {f.file_name}
                        {f.file_size != null ? ` · ${(f.file_size / 1024).toFixed(1)} KB` : ""}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(errors.file || errors.existingFileUrl) && (
              <p className="text-sm text-destructive">{errors.file?.message ?? errors.existingFileUrl?.message}</p>
            )}
            {fileSource === "new" && (
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX, JPG, PNG ou TXT (máx. 10 MB)
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar atividade
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
    </BaseDialog>
  );
}
