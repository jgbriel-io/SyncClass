import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
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
import { useMarkAsPaid, useUpdateFinancialStatus } from "@/hooks/useFinancialRecords";
import { logger } from "@/lib/sentry";

/** Schema do modal Avaliar aula: nota, feedback e confirmar pagamento obrigatórios quando aplicável */
function createPostClassSchema(requirePaymentConfirmation: boolean) {
  return z
    .object({
      attendance: z.boolean(),
      grade: z.string().optional(),
      feedback: z.string().min(1, "Informe o feedback").max(500, "Máximo 500 caracteres"),
      chargeAbsence: z.boolean().optional(),
      confirmPayment: z.boolean().optional(),
      refundPayment: z.boolean().optional(),
    })
    .refine(
      (data) => {
        // Só exige nota se o aluno COMPARECEU
        if (!data.attendance) return true;
        const g = data.grade?.trim();
        if (!g) return false;
        const n = parseFloat(g.replace(",", "."));
        return !Number.isNaN(n) && n >= 0 && n <= 100;
      },
      { message: "Informe a nota (0–100)", path: ["grade"] }
    )
    .refine(
      (data) => {
        // Só exige confirmação de pagamento se COMPARECEU e tem cobrança não paga
        if (!requirePaymentConfirmation) return true;
        if (!data.attendance) return true; // Se faltou, não exige confirmação de pagamento
        return data.confirmPayment === true;
      },
      { message: "Marque a opção para confirmar pagamento", path: ["confirmPayment"] }
    );
}

type PostClassFormData = z.infer<ReturnType<typeof createPostClassSchema>>;

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
  const updateFinancialStatus = useUpdateFinancialStatus();

  // Supabase pode retornar financial_records como objeto ou array (1:1)
  // Também precisa verificar financial_record_class_logs para aulas de pacote
  const financialRecord = (() => {
    // Primeiro tenta financial_records direto
    if (classLog?.financial_records) {
      const records = Array.isArray(classLog.financial_records)
        ? classLog.financial_records
        : [classLog.financial_records];
      if (records.length > 0 && records[0]?.id) {
        return records[0];
      }
    }
    // Se não tem direto, tenta via pacote
    if (classLog?.financial_record_class_logs && classLog.financial_record_class_logs.length > 0) {
      const packageFinancial = classLog.financial_record_class_logs[0]?.financial_records;
      if (packageFinancial?.id) {
        return packageFinancial;
      }
    }
    return null;
  })();
  
  const hasFinancialRecord = !!financialRecord?.id;
  const isPaymentAlreadyPaid = financialRecord?.status === "pago";
  const requirePaymentConfirmation = !!(classLog && hasFinancialRecord && !isPaymentAlreadyPaid);

  const postClassSchema = useMemo(
    () => createPostClassSchema(requirePaymentConfirmation),
    [requirePaymentConfirmation]
  );

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
      refundPayment: false,
    },
  });

  const attendance = watch("attendance");
  const chargeAbsence = watch("chargeAbsence");
  const confirmPayment = watch("confirmPayment");
  const refundPayment = watch("refundPayment");

  useEffect(() => {
    if (open && classLog) {
      reset({
        attendance: classLog.attendance ?? true,
        grade: classLog.grade != null ? String(classLog.grade) : "",
        feedback: classLog.feedback ?? "",
        chargeAbsence: false,
        confirmPayment: isPaymentAlreadyPaid,
        refundPayment: false,
      });
    }
  }, [open, classLog, reset, isPaymentAlreadyPaid]);

  const handleFormSubmit = async (data: PostClassFormData) => {
    if (!classLog) return;

    const attendanceValue = data.attendance;
    const gradeValue = data.grade?.trim()
      ? Math.min(100, Math.max(0, parseFloat(data.grade.replace(",", ".")) || 0))
      : null;
    const feedbackValue = data.feedback?.trim() || null;

    try {
      await updateClassLog.mutateAsync({
        id: classLog.id,
        attendance: attendanceValue,
        grade: gradeValue,
        feedback: feedbackValue,
      });

      // Lógica de cobrança quando o aluno FALTOU
      if (!attendanceValue && hasFinancialRecord && financialRecord?.id) {
        if (!data.chargeAbsence) {
          // Faltou e NÃO quer cobrar
          if (isPaymentAlreadyPaid) {
            // Se já estava pago e marcou para extornar
            if (data.refundPayment) {
              await updateFinancialStatus.mutateAsync({ 
                id: financialRecord.id, 
                status: "extornado" 
              });
            } else {
              // Mantém como pago (não faz nada)
              toast.success("Falta registrada, pagamento mantido como pago");
            }
          } else {
            // Não estava pago, marca como abonado
            await updateFinancialStatus.mutateAsync({ 
              id: financialRecord.id, 
              status: "abonado" 
            });
          }
        } else {
          // Faltou e QUER cobrar: mantém o status atual
          if (isPaymentAlreadyPaid) {
            toast.success("Falta registrada, cobrança mantida como paga");
          } else {
            toast.success("Falta registrada, cobrança mantida como pendente");
          }
        }
      } 
      // Lógica de pagamento quando o aluno COMPARECEU
      else if (attendanceValue && hasFinancialRecord && data.confirmPayment && financialRecord?.id) {
        await markAsPaid.mutateAsync(financialRecord.id);
      } else if (attendanceValue) {
        // Compareceu mas não tem cobrança ou não confirmou pagamento
        toast.success("Avaliação registrada com sucesso");
      } else {
        // Faltou mas não tem cobrança
        toast.success("Falta registrada");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      logger.error(error as Error, { context: 'post_class_evaluation' });
      toast.error("Erro ao registrar avaliação. Tente novamente.");
    }
  };

  const isPending =
    updateClassLog.isPending ||
    markAsPaid.isPending ||
    updateFinancialStatus.isPending;

  if (!classLog) return null;

  const studentName = classLog.students?.name ?? "Aluno";
  const classDateFormatted = format(
    new Date(classLog.class_date + "T12:00:00"),
    "dd/MM/yyyy",
    { locale: ptBR }
  );

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Avaliar aula"
      size="SM"
    >
      <p className="text-sm text-muted-foreground mb-4">
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
            <div className="space-y-2">
              <Label htmlFor="grade">Nota (0–100)</Label>
              <Input
                id="grade"
                type="text"
                placeholder="Ex: 85"
                {...register("grade")}
              />
              {errors.grade && (
                <p className="text-sm text-destructive">{errors.grade.message}</p>
              )}
            </div>
          )}

          {!attendance && hasFinancialRecord && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="chargeAbsence"
                  checked={chargeAbsence}
                  onCheckedChange={(checked) =>
                    setValue("chargeAbsence", !!checked)
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="chargeAbsence" className="cursor-pointer font-medium">
                    Cobrar esta falta
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {chargeAbsence 
                      ? "A cobrança será mantida com o status atual"
                      : isPaymentAlreadyPaid
                        ? "A cobrança será mantida como paga (ou extornada se marcar abaixo)"
                        : "A cobrança será marcada como abonada (não cobrada)"}
                  </p>
                </div>
              </div>
              
              {!chargeAbsence && isPaymentAlreadyPaid && (
                <div className="flex items-start gap-2 ml-6 pt-2 border-t">
                  <Checkbox
                    id="refundPayment"
                    checked={refundPayment}
                    onCheckedChange={(checked) =>
                      setValue("refundPayment", !!checked)
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="refundPayment" className="cursor-pointer font-medium text-amber-600">
                      Extornar pagamento
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      O pagamento será marcado como extornado (devolvido ao aluno)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
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

          {attendance && hasFinancialRecord && (
            <div className="space-y-2">
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
              {errors.confirmPayment && (
                <p className="text-sm text-destructive">{errors.confirmPayment.message}</p>
              )}
            </div>
          )}

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
    </BaseDialog>
  );
}
