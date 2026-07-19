import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { useUpdateClassLog } from "@/hooks/useClassLogs";
import { useUpdateFinancialStatus } from "@/hooks/useFinancialRecords";
import { logger } from "@/lib/logger";
import { PostClassAbsenceSection } from "./PostClassAbsenceSection";
import { STACK, GAP } from "@/lib/design-tokens/spacing";
import { ICON_SIZES } from "@/lib/design-tokens/icon-sizes";
import { TYPOGRAPHY } from "@/lib/design-tokens/typography";
import { classes as classesContent, common } from "@/content";

const postClassSchema = z
  .object({
    attendance: z.boolean(),
    grade: z.string().optional(),
    feedback: z
      .string()
      .min(1, "Informe o feedback")
      .max(500, "Máximo 500 caracteres"),
    chargeAbsence: z.boolean().optional(),
    refundPayment: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.attendance) return true;
      const g = data.grade?.trim();
      if (!g) return false;
      const n = parseFloat(g.replace(",", "."));
      return !Number.isNaN(n) && n >= 0 && n <= 100;
    },
    { message: "Informe a nota (0–100)", path: ["grade"] }
  );

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
  const updateFinancialStatus = useUpdateFinancialStatus();

  const financialRecord = (() => {
    if (classLog?.financial_records) {
      const records = Array.isArray(classLog.financial_records)
        ? classLog.financial_records
        : [classLog.financial_records];
      if (records.length > 0 && records[0]?.id) return records[0];
    }
    if (
      classLog?.financial_record_class_logs &&
      classLog.financial_record_class_logs.length > 0
    ) {
      const pkg = classLog.financial_record_class_logs[0]?.financial_records;
      if (pkg?.id) return pkg;
    }
    return null;
  })();

  const hasFinancialRecord = !!financialRecord?.id;
  const isPaymentAlreadyPaid = financialRecord?.status === "pago";

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
      refundPayment: false,
    },
  });

  const attendance = watch("attendance");
  const chargeAbsence = watch("chargeAbsence");
  const refundPayment = watch("refundPayment");

  useEffect(() => {
    if (open && classLog) {
      reset({
        attendance: classLog.attendance ?? true,
        grade: classLog.grade != null ? String(classLog.grade) : "",
        feedback: classLog.feedback ?? "",
        chargeAbsence: false,
        refundPayment: false,
      });
    }
  }, [open, classLog, reset]);

  const handleFormSubmit = async (data: PostClassFormData) => {
    if (!classLog) return;

    const gradeValue = data.grade?.trim()
      ? Math.min(
          100,
          Math.max(0, parseFloat(data.grade.replace(",", ".")) || 0)
        )
      : null;
    const feedbackValue = data.feedback?.trim() || null;

    const originalToastSuccess = toast.success;
    const toastQueue: string[] = [];
    toast.success = (message: string) => {
      toastQueue.push(message);
      return 0;
    };
    let successMessage = "";
    try {
      await updateClassLog.mutateAsync({
        id: classLog.id,
        attendance: data.attendance,
        grade: gradeValue,
        feedback: feedbackValue,
      });

      if (!data.attendance && hasFinancialRecord && financialRecord?.id) {
        if (!data.chargeAbsence) {
          if (isPaymentAlreadyPaid && data.refundPayment) {
            await updateFinancialStatus.mutateAsync({
              id: financialRecord.id,
              status: "extornado",
            });
            successMessage = "Falta registrada e pagamento extornado";
          } else if (!isPaymentAlreadyPaid) {
            await updateFinancialStatus.mutateAsync({
              id: financialRecord.id,
              status: "abonado",
            });
            successMessage = "Falta registrada e cobrança abonada";
          } else {
            successMessage = "Falta registrada, pagamento mantido como pago";
          }
        } else {
          successMessage = isPaymentAlreadyPaid
            ? "Falta registrada, cobrança mantida como paga"
            : "Falta registrada, cobrança mantida como pendente";
        }
      } else {
        successMessage = "Avaliação registrada com sucesso";
      }

      originalToastSuccess(successMessage);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      logger.error(error as Error, { context: "post_class_evaluation" });
      toast.error(classesContent.postClassDialog.toasts.evaluationError);
    } finally {
      toast.success = originalToastSuccess;
    }
  };

  const isPending = updateClassLog.isPending || updateFinancialStatus.isPending;

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
            <Label htmlFor="grade">
              {classesContent.postClassDialog.gradeLabel}
            </Label>
            <Input
              id="grade"
              type="text"
              inputMode="numeric"
              placeholder={common.placeholders.gradeHint}
              {...register("grade")}
              onKeyDown={(e) => {
                if (
                  [
                    "Backspace",
                    "Delete",
                    "Tab",
                    "Escape",
                    "Enter",
                    ".",
                    ",",
                    "ArrowLeft",
                    "ArrowRight",
                  ].includes(e.key)
                )
                  return;
                if (!/[0-9]/.test(e.key)) e.preventDefault();
              }}
            />
            {errors.grade && (
              <p className={`${TYPOGRAPHY.BODY} text-destructive`}>
                {errors.grade.message}
              </p>
            )}
          </div>
        )}

        {!attendance && hasFinancialRecord && (
          <PostClassAbsenceSection
            chargeAbsence={chargeAbsence}
            refundPayment={refundPayment}
            isPaymentAlreadyPaid={isPaymentAlreadyPaid}
            onChargeAbsenceChange={(checked) =>
              setValue("chargeAbsence", checked)
            }
            onRefundPaymentChange={(checked) =>
              setValue("refundPayment", checked)
            }
          />
        )}

        <div className={STACK.TIGHT}>
          <Label htmlFor="feedback">
            {classesContent.postClassDialog.feedbackLabel}
          </Label>
          <Textarea
            id="feedback"
            placeholder={common.placeholders.classNotesHint}
            rows={3}
            {...register("feedback")}
          />
          {errors.feedback && (
            <p className={`${TYPOGRAPHY.BODY} text-destructive`}>
              {errors.feedback.message}
            </p>
          )}
        </div>

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
            {isPending && (
              <Loader2 className={`mr-2 ${ICON_SIZES.SM} animate-spin`} />
            )}
            {classesContent.postClassDialog.save}
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
