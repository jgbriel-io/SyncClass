import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, FileText } from "lucide-react";
import { useAddActivityCorrection, uploadActivityFile, ActivityWithRelations } from "@/hooks/useActivities";
import { toast } from "sonner";

const correctionSchema = z
  .object({
    feedback: z.string().min(1, "Informe o feedback"),
    grade: z.string().min(1, "Informe a nota (0–100)"),
    correctionFile: z.instanceof(File).optional(),
  })
  .refine(
    (data) => {
      const g = data.grade?.trim();
      if (!g) return false;
      const n = parseFloat(g.replace(",", "."));
      return !Number.isNaN(n) && n >= 0 && n <= 100;
    },
    { message: "Informe a nota (0–100)", path: ["grade"] }
  );

type CorrectionFormData = z.infer<typeof correctionSchema>;

interface AddCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ActivityWithRelations | null;
}

export function AddCorrectionDialog({
  open,
  onOpenChange,
  activity,
}: AddCorrectionDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("correctionFile", file);
    }
  };

  const handleFormSubmit = async (data: CorrectionFormData) => {
    if (!activity) return;

    setIsUploading(true);
    try {
      let correctionFileUrl: string | undefined;
      let correctionFileName: string | undefined;

      // Upload do arquivo de correção (se houver)
      if (data.correctionFile) {
        const { url } = await uploadActivityFile(data.correctionFile);
        correctionFileUrl = url;
        correctionFileName = data.correctionFile.name;
      }

      const gradeValue = data.grade?.trim()
        ? Math.min(100, Math.max(0, parseFloat(data.grade.replace(",", ".")) || 0))
        : null;
      await addCorrection.mutateAsync({
        activityId: activity.id,
        feedback: data.feedback.trim(),
        grade: gradeValue,
        correctionFileUrl,
        correctionFileName,
      });

      reset();
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao enviar correção: " + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = isUploading || addCorrection.isPending;

  if (!activity) return null;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Correção e feedback"
      size="SM"
    >
      <DialogDescription asChild>
        <div className="space-y-1 mb-4">
          <p className="text-sm text-muted-foreground">
            Atividade: <span className="font-medium text-foreground">{activity.title}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Aluno: <span className="font-medium text-foreground">{activity.students?.name}</span>
          </p>
        </div>
      </DialogDescription>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback *</Label>
            <Textarea
              id="feedback"
              placeholder="Escreva sua correção, observações, elogios..."
              rows={5}
              {...register("feedback")}
              disabled={isPending}
            />
            {errors.feedback && (
              <p className="text-sm text-destructive">{errors.feedback.message}</p>
            )}
          </div>

          {/* Nota (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="grade">Nota (0–100) *</Label>
            <Input
              id="grade"
              type="text"
              placeholder="Ex: 85"
              {...register("grade")}
              disabled={isPending}
            />
            {errors.grade && (
              <p className="text-sm text-destructive">{errors.grade.message}</p>
            )}
          </div>

          {/* Upload de Arquivo de Correção (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="correctionFile">Arquivo de Correção (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="correctionFile"
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
            <p className="text-xs text-muted-foreground">
              Arquivo com a correção detalhada (opcional)
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
                  Enviar correção
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
    </BaseDialog>
  );
}
