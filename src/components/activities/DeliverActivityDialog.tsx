import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { uploadActivityFile } from "@/hooks/useActivities";
import { toast } from "sonner";

const deliverSchema = z.object({
  response_text: z.string().optional(),
  response_file: z.instanceof(File).optional(),
}).refine((data) => data.response_text || data.response_file, {
  message: "Forneça uma resposta em texto ou envie um arquivo",
  path: ["response_text"],
});

type DeliverFormData = z.infer<typeof deliverSchema>;

interface DeliverActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeliver: (data: { responseText?: string; responseFileUrl?: string; responseFileName?: string }) => Promise<void>;
  activityTitle: string;
}

export function DeliverActivityDialog({
  open,
  onOpenChange,
  onDeliver,
  activityTitle,
}: DeliverActivityDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DeliverFormData>({
    resolver: zodResolver(deliverSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("response_file", file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValue("response_file", undefined);
  };

  const handleFormSubmit = async (data: DeliverFormData) => {
    setIsSubmitting(true);
    try {
      let responseFileUrl: string | undefined;
      let responseFileName: string | undefined;

      // Upload do arquivo se houver
      if (data.response_file) {
        const { url, path } = await uploadActivityFile(data.response_file);
        responseFileUrl = path; // Armazenamos o path, não a URL
        responseFileName = data.response_file.name;
      }

      // Enviar resposta
      await onDeliver({
        responseText: data.response_text?.trim() || undefined,
        responseFileUrl,
        responseFileName,
      });

      reset();
      setSelectedFile(null);
      onOpenChange(false);
      toast.success("Atividade entregue com sucesso!");
    } catch (error) {
      console.error("Erro ao entregar atividade:", error);
      toast.error("Erro ao entregar atividade: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Entregar atividade"
      description={activityTitle}
      size="LG"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="response_text">
              Resposta (texto)
            </Label>
            <Textarea
              id="response_text"
              {...register("response_text")}
              placeholder="Digite sua resposta aqui..."
              rows={6}
              className="resize-none"
            />
            {errors.response_text && (
              <p className="text-sm text-destructive">{errors.response_text.message}</p>
            )}
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response_file">
              Ou envie um arquivo (PDF, imagem, documento)
            </Label>
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <Label
                  htmlFor="response_file"
                  className="cursor-pointer text-sm text-primary hover:underline"
                >
                  Clique para selecionar um arquivo
                </Label>
                <input
                  id="response_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, Imagem ou Documento (máx. 50MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-accent rounded-lg p-4">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {errors.response_file && (
              <p className="text-sm text-destructive">{errors.response_file.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Entregar atividade"
              )}
            </Button>
          </DialogFooter>
        </form>
    </BaseDialog>
  );
}
