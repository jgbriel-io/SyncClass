import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAddActivityCorrection, uploadActivityFile, type ActivityWithRelations } from "@/hooks/useActivities";

const correctionSchema = z
  .object({
    feedback: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Informe o feedback")),
    grade: z.string().min(1, "Informe a nota (0–100)"),
    correctionFile: z.any().optional(),
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

interface ActivityCorrectionFormInlineProps {
  activity: ActivityWithRelations;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ActivityCorrectionFormInline({ activity, onSuccess, onCancel }: ActivityCorrectionFormInlineProps) {
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
      ? Math.min(100, Math.max(0, parseFloat(data.grade.replace(",", ".")) || 0))
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
    <form
      onSubmit={handleSubmit(handleCorrectionSubmit, (err) =>
        toast.error(err.feedback?.message ?? err.grade?.message ?? "Preencha o feedback e a nota.")
      )}
      className="space-y-4 border-t pt-4 mt-4"
    >
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
        <Label htmlFor={`grade-${activity.id}`}>Nota (0–100) *</Label>
        <Input
          id={`grade-${activity.id}`}
          type="text"
          placeholder="Ex: 85"
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
          {selectedFile && (
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">{selectedFile.name}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending} className={onCancel ? "flex-1 border-none bg-success-action text-white hover:bg-success-action/90" : "w-full border-none bg-success-action text-white hover:bg-success-action/90"}>
          {isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" />Enviar correção</>
          )}
        </Button>
      </div>
    </form>
  );
}
