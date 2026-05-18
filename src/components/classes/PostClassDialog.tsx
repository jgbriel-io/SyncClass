import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { useUpdateClassLog } from "@/hooks/useClassLogs";
import { useMarkAsPaid, useUpdateFinancialStatus } from "@/hooks/useFinancialRecords";
import { logger } from "@/lib/sentry";
import { PostClassAbsenceSection } from "./PostClassAbsenceSection";
import { PostClassPaymentSection } from "./PostClassPaymentSection";
import { STACK, GAP } from "@/lib/design-tokens/spacing";
import { ICON_SIZES } from "@/lib/design-tokens/icon-sizes";
import { TYPOGRAPHY } from "@/lib/design-tokens/typography";
import { classes as classesContent, common } from "@/content";

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
  
  // Hooks com toasts desabilitados (vamos mostrar um toast único no final)
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
  
  // Verificar se tem comprovante anexado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasPaymentProof = !!(financialRecord as any)?.payment_proof_url;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentProofUrl = (financialRecord as any)?.payment_proof_url;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentProofFilename = (financialRecord as any)?.payment_proof_filename || "Comprovante";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentProofStatus = (financialRecord as any)?.payment_proof_status;

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
      // Suprimir toasts automáticos temporariamente
      const originalToastSuccess = toast.success;
      const toastQueue: string[] = [];
      
      // Interceptar toasts durante as operações
      toast.success = (message: string) => {
        toastQueue.push(message);
        return 0; // Retornar um ID dummy
      };

      await updateClassLog.mutateAsync({
        id: classLog.id,
        attendance: attendanceValue,
        grade: gradeValue,
        feedback: feedbackValue,
      });

      let successMessage = "";

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
              successMessage = "Falta registrada e pagamento extornado";
            } else {
              // Mantém como pago (não faz nada)
              successMessage = "Falta registrada, pagamento mantido como pago";
            }
          } else {
            // Não estava pago, marca como abonado
            await updateFinancialStatus.mutateAsync({ 
              id: financialRecord.id, 
              status: "abonado" 
            });
            successMessage = "Falta registrada e cobrança abonada";
          }
        } else {
          // Faltou e QUER cobrar: mantém o status atual
          if (isPaymentAlreadyPaid) {
            successMessage = "Falta registrada, cobrança mantida como paga";
          } else {
            successMessage = "Falta registrada, cobrança mantida como pendente";
          }
        }
      } 
      // Lógica de pagamento quando o aluno COMPARECEU
      else if (attendanceValue && hasFinancialRecord && data.confirmPayment && financialRecord?.id) {
        await markAsPaid.mutateAsync(financialRecord.id);
        successMessage = "Avaliação e pagamento registrados com sucesso";
      } else if (attendanceValue) {
        // Compareceu mas não tem cobrança ou não confirmou pagamento
        successMessage = "Avaliação registrada com sucesso";
      } else {
        // Faltou mas não tem cobrança
        successMessage = "Falta registrada";
      }

      // Restaurar toast original e mostrar apenas uma mensagem
      toast.success = originalToastSuccess;
      toast.success(successMessage);
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Restaurar toast original em caso de erro
      toast.success = originalToastSuccess;
      logger.error(error as Error, { context: 'post_class_evaluation' });
      toast.error(classesContent.postClassDialog.toasts.evaluationError);
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
      title={classesContent.postClassDialog.title}
      size="SM"
    >
      <p className={`${TYPOGRAPHY.BODY} text-muted-foreground mb-4`}>
        {studentName} — {classDateFormatted}
      </p>
      <form onSubmit={handleSubmit(handleFormSubmit)} className={STACK.DEFAULT}>
          <div className={STACK.TIGHT}>
            <Label>{classesContent.postClassDialog.attendanceLabel}</Label>
            <div className={`flex ${GAP.LOOSE}`}>
              <label className={`flex items-center ${GAP.TIGHT} cursor-pointer`}>
                <input
                  type="radio"
                  checked={attendance === true}
                  onChange={() => setValue("attendance", true)}
                  className="rounded-full"
                />
                <span>{classesContent.postClassDialog.attended}</span>
              </label>
              <label className={`flex items-center ${GAP.TIGHT} cursor-pointer`}>
                <input
                  type="radio"
                  checked={attendance === false}
                  onChange={() => setValue("attendance", false)}
                  className="rounded-full"
                />
                <span>{classesContent.postClassDialog.absent}</span>
              </label>
            </div>
          </div>

          {attendance && (
            <div className={STACK.TIGHT}>
              <Label htmlFor="grade">{classesContent.postClassDialog.gradeLabel}</Label>
              <Input
                id="grade"
                type="text"
                inputMode="numeric"
                placeholder={common.placeholders.gradeHint}
                {...register("grade")}
                onKeyDown={(e) => {
                  // Permitir: backspace, delete, tab, escape, enter, ponto, vírgula
                  if (
                    e.key === "Backspace" ||
                    e.key === "Delete" ||
                    e.key === "Tab" ||
                    e.key === "Escape" ||
                    e.key === "Enter" ||
                    e.key === "." ||
                    e.key === "," ||
                    e.key === "ArrowLeft" ||
                    e.key === "ArrowRight"
                  ) {
                    return;
                  }
                  // Bloquear se não for número
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.grade && (
                <p className={`${TYPOGRAPHY.BODY} text-destructive`}>{errors.grade.message}</p>
              )}
            </div>
          )}

          {!attendance && hasFinancialRecord && (
            <PostClassAbsenceSection
              chargeAbsence={chargeAbsence}
              refundPayment={refundPayment}
              isPaymentAlreadyPaid={isPaymentAlreadyPaid}
              onChargeAbsenceChange={(checked) => setValue("chargeAbsence", checked)}
              onRefundPaymentChange={(checked) => setValue("refundPayment", checked)}
            />
          )}

          <div className={STACK.TIGHT}>
            <Label htmlFor="feedback">{classesContent.postClassDialog.feedbackLabel}</Label>
            <Textarea
              id="feedback"
              placeholder={common.placeholders.classNotesHint}
              rows={3}
              {...register("feedback")}
            />
            {errors.feedback && (
              <p className={`${TYPOGRAPHY.BODY} text-destructive`}>{errors.feedback.message}</p>
            )}
          </div>

          {attendance && hasFinancialRecord && (
            <PostClassPaymentSection
              confirmPayment={confirmPayment}
              isPaymentAlreadyPaid={isPaymentAlreadyPaid}
              hasPaymentProof={hasPaymentProof}
              paymentProofUrl={paymentProofUrl}
              paymentProofFilename={paymentProofFilename}
              paymentProofStatus={paymentProofStatus}
              onConfirmPaymentChange={(checked) => setValue("confirmPayment", checked)}
              errorMessage={errors.confirmPayment?.message}
            />
          )}

          <div className={`flex justify-end ${GAP.TIGHT} pt-2`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {classesContent.postClassDialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className={`mr-2 ${ICON_SIZES.SM} animate-spin`} />}
              {classesContent.postClassDialog.save}
            </Button>
          </div>
        </form>
    </BaseDialog>
  );
}
