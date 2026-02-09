import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { useUpdateClassLog } from "@/hooks/useClassLogs";
import { useMarkAsPaid, useDeleteFinancialRecord } from "@/hooks/useFinancialRecords";

const postClassSchema = z.object({
  attendance: z.boolean(),
  grade: z.string().optional(),
  feedback: z.string().max(500).optional(),
  chargeAbsence: z.boolean().optional(),
  confirmPayment: z.boolean().optional(),
});

type PostClassFormData = z.infer<typeof postClassSchema>;

interface PostClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classLog: ClassLogWithStudent | null;
  onSuccess: () => void;
}

export function PostClassDialog({
  open,
  onOpenChange,
  classLog,
  onSuccess,
}: PostClassDialogProps) {
  const updateClassLog = useUpdateClassLog();
  const markAsPaid = useMarkAsPaid();
  const deleteFinancialRecord = useDeleteFinancialRecord();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostClassFormData>({
    resolver: zodResolver(postClassSchema),
    defaultValues: {
      attendance: true,
      grade: "",
      feedback: "",
      chargeAbsence: false,
      confirmPayment: false,
    },
  });

  const attendance = watch("attendance");
  const chargeAbsence = watch("chargeAbsence");
  const confirmPayment = watch("confirmPayment");

  const hasFinancialRecord = !!classLog?.financial_records?.id;

  const isPaymentAlreadyPaid = classLog?.financial_records?.status === "pago";

  useEffect(() => {
    if (open && classLog) {
      reset({
        attendance: classLog.attendance ?? true,
        grade: classLog.grade != null ? String(classLog.grade) : "",
        feedback: classLog.feedback ?? "",
        chargeAbsence: false,
        confirmPayment: isPaymentAlreadyPaid,
      });
    }
  }, [open, classLog, reset, isPaymentAlreadyPaid]);

  const handleFormSubmit = async (data: PostClassFormData) => {
    if (!classLog) return;

    const attendanceValue = data.attendance;
    const gradeValue = data.grade?.trim()
      ? Math.min(10, Math.max(0, parseFloat(data.grade.replace(",", ".")) || 0))
      : null;
    const feedbackValue = data.feedback?.trim() || null;

    try {
      await updateClassLog.mutateAsync({
        id: classLog.id,
        attendance: attendanceValue,
        grade: gradeValue,
        feedback: feedbackValue,
      });

      if (!attendanceValue && hasFinancialRecord && !data.chargeAbsence) {
        await deleteFinancialRecord.mutateAsync(classLog.financial_records!.id);
      } else if (attendanceValue && hasFinancialRecord && data.confirmPayment) {
        await markAsPaid.mutateAsync(classLog.financial_records!.id);
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao registrar avaliação. Tente novamente.");
    }
  };

  const isPending =
    updateClassLog.isPending ||
    markAsPaid.isPending ||
    deleteFinancialRecord.isPending;

  if (!classLog) return null;

  const studentName = classLog.students?.name ?? "Aluno";
  const classDateFormatted = format(
    new Date(classLog.class_date + "T12:00:00"),
    "dd/MM/yyyy",
    { locale: ptBR }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar aula</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {studentName} — {classDateFormatted}
        </p>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Comparecimento</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={attendance === true}
                  onChange={() => setValue("attendance", true)}
                  className="rounded-full"
                />
                <span>Compareceu</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={attendance === false}
                  onChange={() => setValue("attendance", false)}
                  className="rounded-full"
                />
                <span>Faltou</span>
              </label>
            </div>
          </div>

          {attendance && (
            <>
              <div className="space-y-2">
                <Label htmlFor="grade">Nota (0–10)</Label>
                <Input
                  id="grade"
                  type="text"
                  placeholder="Ex: 8.5"
                  {...register("grade")}
                />
                {errors.grade && (
                  <p className="text-sm text-destructive">{errors.grade.message}</p>
                )}
              </div>
              {hasFinancialRecord && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="confirmPayment"
                    checked={confirmPayment}
                    disabled={isPaymentAlreadyPaid}
                    onCheckedChange={(checked) =>
                      setValue("confirmPayment", !!checked)
                    }
                  />
                  <Label
                    htmlFor="confirmPayment"
                    className={isPaymentAlreadyPaid ? "cursor-default text-muted-foreground" : "cursor-pointer"}
                  >
                    Confirmar pagamento
                  </Label>
                </div>
              )}
            </>
          )}

          {!attendance && hasFinancialRecord && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="chargeAbsence"
                checked={chargeAbsence}
                onCheckedChange={(checked) =>
                  setValue("chargeAbsence", !!checked)
                }
              />
              <Label htmlFor="chargeAbsence" className="cursor-pointer">
                Cobrar esta falta?
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (opcional)</Label>
            <Textarea
              id="feedback"
              placeholder="Observações sobre a aula..."
              rows={3}
              {...register("feedback")}
            />
            {errors.feedback && (
              <p className="text-sm text-destructive">{errors.feedback.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
