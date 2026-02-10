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
import { Loader2, Upload, FileText } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useCreateActivity, uploadActivityFile, ActivityInsert } from "@/hooks/useActivities";
import { toast } from "sonner";

const activitySchema = z.object({
  student_id: z.string().min(1, "Selecione um aluno"),
  title: z.string().min(1, "Informe o título da atividade"),
  description: z.string().optional(),
  file: z.instanceof(File, { message: "Selecione um arquivo" }),
});

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
  const createActivity = useCreateActivity();
  const activeStudents = students.filter((s) => s.status === "ativo");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("file", file);
    }
  };

  const handleFormSubmit = async (data: ActivityFormData) => {
    setIsUploading(true);
    try {
      // Upload do arquivo
      const { url, path } = await uploadActivityFile(data.file);

      // Criar registro da atividade
      const activityData: ActivityInsert = {
        student_id: data.student_id,
        teacher_id: teacherId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        file_url: url,
        file_name: data.file.name,
        file_type: data.file.type,
        file_size: data.file.size,
        status: "enviada",
      };

      await createActivity.mutateAsync(activityData);

      reset();
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

          {/* Upload de Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo *</Label>
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
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="text-sm text-destructive">{errors.file.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, JPG, PNG ou TXT (máx. 10 MB)
            </p>
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
