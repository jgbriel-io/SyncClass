import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, FileText, FolderOpen } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import {
  useCreateActivity,
  uploadActivityFile,
  useActivityFilesForTeacher,
  ActivityInsert,
} from "@/hooks/useActivities";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const activitySchema = z
  .object({
    student_id: z.string().min(1, "Selecione um aluno"),
    title: z.string().min(1, "Informe o título da atividade"),
    description: z.string().optional(),
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
    defaultValues: { fileSource: "new" },
  });

  const fileSource = watch("fileSource");

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
        file_url,
        file_name,
        file_type,
        file_size,
        status: "enviada",
      };

      await createActivity.mutateAsync(activityData);

      reset({ fileSource: "new" });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Enviar atividade</DialogTitle>
          <DialogDescription>
            Selecione o aluno, preencha o título e anexe o arquivo da atividade.
          </DialogDescription>
        </DialogHeader>
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

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Instruções, observações, prazo..."
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
      </DialogContent>
    </Dialog>
  );
}
