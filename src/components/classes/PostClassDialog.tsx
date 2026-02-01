import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Receipt, CheckCircle2 } from "lucide-react";
import { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { useUpdateClassLog } from "@/hooks/useClassLogs";
import { useMarkAsPaid } from "@/hooks/useFinancialRecords";
import { parseMoneyToNumber } from "@/lib/utils/patterns";
import { formatCurrency } from "@/lib/utils/formatters";

function createPostClassSchema(hasFinancialRecord: boolean) {
  return z.object({
    attendance: z.boolean(),
    grade: z.string(),
    feedback: z
      .string()
      .min(1, "Informe o feedback da aula")
      .max(1000, "Máximo 1000 caracteres"),
    confirmPayment: z.boolean(),
  }).superRefine((data, ctx) => {
    if (data.attendance) {
      const trimmed = data.grade?.trim() ?? "";
      if (!trimmed) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a nota (0 a 10)", path: ["grade"] });
        return;
      }
      const num = parseMoneyToNumber(data.grade);
      if (isNaN(num) || num < 0 || num > 10) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nota deve ser entre 0 e 10", path: ["grade"] });
      }
    }
    if (hasFinancialRecord && !data.confirmPayment) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marque para confirmar o pagamento", path: ["confirmPayment"] });
    }
  });
}

type PostClassFormData = z.infer<ReturnType<typeof createPostClassSchema>>;

interface PostClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classLog: ClassLogWithStudent | null;
  onSuccess?: () => void;
}

export function PostClassDialog({
  open,
  onOpenChange,
  classLog,
  onSuccess,
}: PostClassDialogProps) {
  const [attendance, setAttendance] = useState(true);
  const updateLog = useUpdateClassLog();
  const markAsPaid = useMarkAsPaid();

  const hasFinancialRecord =
    classLog?.financial_records != null && classLog.financial_records.status !== "pago";
  const postClassSchema = createPostClassSchema(!!hasFinancialRecord);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostClassFormData>({
    resolver: zodResolver(postClassSchema as z.ZodType<PostClassFormData>),
    defaultValues: {
      attendance: true,
      confirmPayment: false,
    },
  });

  const confirmPayment = watch("confirmPayment");

  useEffect(() => {
    if (open && classLog) {
      setAttendance(classLog.attendance ?? true);
      setValue("attendance", classLog.attendance ?? true);
      setValue("grade", classLog.grade?.toString() || "");
      setValue("feedback", classLog.feedback || "");
      setValue("confirmPayment", false);
    } else if (!open) {
      reset();
    }
  }, [open, classLog, reset, setValue]);

  const handleFormSubmit = (data: PostClassFormData) => {
    if (!classLog) return;

    let grade: number | null = null;
    if (data.grade && data.attendance) {
      const parsed = parseMoneyToNumber(data.grade);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
        grade = parsed;
      }
    }

    updateLog.mutate(
      {
        id: classLog.id,
        attendance: data.attendance,
        grade: data.attendance ? grade : null,
        feedback: data.feedback?.trim() || null,
      },
      {
        onSuccess: () => {
          if (
            data.confirmPayment &&
            hasFinancialRecord &&
            classLog.financial_records?.id
          ) {
            markAsPaid.mutate(classLog.financial_records.id, {
              onSuccess: () => {
                onSuccess?.();
                onOpenChange(false);
              },
              onError: () => {
                onSuccess?.();
                onOpenChange(false);
              },
            });
          } else {
            onSuccess?.();
            onOpenChange(false);
          }
        },
      }
    );
  };

  const isPending = updateLog.isPending || markAsPaid.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Concluir aula
          </DialogTitle>
        </DialogHeader>

        {classLog ? (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">
                {classLog.students?.name || "Aluno"}
              </p>
              <p className="text-xs text-muted-foreground">
                {classLog.title || "Aula"} • {new Date(classLog.class_date + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>

            {/* Presença */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="attendance">Presença</Label>
                <p className="text-sm text-muted-foreground">
                  O aluno compareceu à aula?
                </p>
              </div>
              <Switch
                id="attendance"
                checked={attendance}
                onCheckedChange={(checked) => {
                  setAttendance(checked);
                  setValue("attendance", checked);
                  if (!checked) setValue("grade", "");
                }}
              />
            </div>

            {/* Nota - apenas se presente */}
            {attendance && (
              <div className="space-y-2">
                <Label htmlFor="grade">Nota (0 a 10)</Label>
                <Input
                  id="grade"
                  type="text"
                  placeholder="8.5"
                  {...register("grade")}
                />
                {errors.grade && (
                  <p className="text-xs text-destructive">{errors.grade.message}</p>
                )}
              </div>
            )}

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Como foi a aula? Pontos a melhorar..."
                rows={4}
                {...register("feedback")}
              />
              {errors.feedback && (
                <p className="text-sm text-destructive">{errors.feedback.message}</p>
              )}
            </div>

            {/* Confirmar pagamento */}
            {hasFinancialRecord && (
              <div className="space-y-1">
                <div className="flex items-center space-x-3 rounded-lg border border-dashed p-4 bg-accent/20">
                  <Checkbox
                    id="confirmPayment"
                    checked={confirmPayment}
                    onCheckedChange={(checked) =>
                      setValue("confirmPayment", checked === true, { shouldValidate: true })
                    }
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="confirmPayment" className="cursor-pointer font-medium">
                      Confirmar pagamento de {formatCurrency(Number(classLog.financial_records?.amount))}
                    </Label>
                  </div>
                </div>
                {errors.confirmPayment && (
                  <p className="text-xs text-destructive">{errors.confirmPayment.message}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
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
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
