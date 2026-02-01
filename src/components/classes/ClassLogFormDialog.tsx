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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Receipt } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { ClassLogInsert, ClassLogWithStudent, ClassLogWithFinancialData } from "@/hooks/useClassLogs";
import { maskDate, isValidDateString, parseMoneyToNumber, REGEX_PATTERNS } from "@/lib/utils/patterns";
import { formatCurrency } from "@/lib/utils/formatters";

const REGEX_TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

function isoDateToBr(value: string): string {
  if (!value) return "";

  const parts = value.split("-");
  if (parts.length !== 3) return value;

  const [year, month, day] = parts;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

/** Retorna true se a data (dd/mm/yyyy) for futura em relação a hoje */
function isDateFuture(brDate: string): boolean {
  if (!brDate || !REGEX_PATTERNS.date.test(brDate)) return false;
  const iso = brDateToIso(brDate);
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > today;
}
const classLogBaseSchema = z.object({
  student_id: z.string().min(1, "Selecione um aluno"),
  class_date: z.string()
    .min(1, "Informe a data da aula")
    .regex(REGEX_PATTERNS.date, "Formato deve ser dd/mm/aaaa")
    .refine(isValidDateString, { message: "Data inválida" }),
  title: z.string().optional(),
  observations: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  start_time: z.string().optional().refine((v) => !v || REGEX_TIME.test(v), { message: "Formato HH:mm" }),
  end_time: z.string().optional().refine((v) => !v || REGEX_TIME.test(v), { message: "Formato HH:mm" }),
  financial_amount: z.string().optional(),
  financial_due_date: z.string().optional().refine(
    (val) => !val || isValidDateString(val),
    { message: "Data inválida" }
  ),
  financial_description: z.string().optional(),
  financial_payment_method: z.string().optional(),
  semCobranca: z.boolean().optional(),
}).refine(
  (data) => {
    if (!data.start_time || !data.end_time) return true;
    const [sh, sm] = data.start_time.split(":").map(Number);
    const [eh, em] = data.end_time.split(":").map(Number);
    return eh > sh || (eh === sh && em > sm);
  },
  { message: "Horário de término deve ser posterior ao início", path: ["end_time"] }
);

function createClassLogSchema(isEditing: boolean) {
  return classLogBaseSchema.refine(
    (data) => {
      if (isEditing || data.semCobranca) return true;
      const a = parseMoneyToNumber(data.financial_amount || "");
      return !isNaN(a) && a > 0;
    },
    { message: "Informe o valor da cobrança", path: ["financial_amount"] }
  ).refine(
    (data) => {
      if (isEditing || data.semCobranca) return true;
      return !!(data.financial_due_date && data.financial_due_date.trim());
    },
    { message: "Informe a data de vencimento", path: ["financial_due_date"] }
  );
}

type ClassLogFormData = z.infer<ReturnType<typeof createClassLogSchema>>;

function buildTimestamptzFromDateAndTime(classDateIso: string, time: string): string {
  const [y, m, d] = classDateIso.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0).toISOString();
}

function extractTimeFromIso(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

interface ClassLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classLog?: ClassLogWithStudent | null;
  onSubmit: (data: ClassLogInsert) => void;
  teacherId?: string;
  onSubmitWithFinancial?: (data: ClassLogWithFinancialData) => void;
  isLoading: boolean;
  enableTeacherSelection?: boolean;
}

export function ClassLogFormDialog({
  open,
  onOpenChange,
  classLog,
  onSubmit,
  onSubmitWithFinancial,
  isLoading,
  teacherId,
  enableTeacherSelection,
}: ClassLogFormDialogProps & { teacherId?: string; enableTeacherSelection?: boolean }) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teacherId || "");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const selectedTeacherName = teachers.find((t: Teacher) => t.id === selectedTeacherId)?.name;
  const activeStudents = students.filter((s) => s.status === "ativo");

  const isEditing = !!classLog;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassLogFormData>({
    resolver: zodResolver(createClassLogSchema(isEditing)),
    defaultValues: { semCobranca: false },
  });

  const classDate = watch("class_date");
  const startTime = watch("start_time");
  const endTime = watch("end_time");
  const financialAmount = watch("financial_amount");
  const semCobranca = watch("semCobranca");
  const isFutureDate = isDateFuture(classDate || "");

  const selectedStudent = activeStudents.find((s) => s.id === selectedStudentId);
  const hourlyRate = selectedStudent?.hourly_rate ?? null;

  // Duração efetiva: calculada de início e término
  const effectiveDurationMinutes = (() => {
    if (startTime && endTime && classDate && REGEX_PATTERNS.date.test(classDate)) {
      const iso = brDateToIso(classDate);
      const [y, m, d] = iso.split("-").map(Number);
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startMs = new Date(y, m - 1, d, sh, sm, 0).getTime();
      const endMs = new Date(y, m - 1, d, eh, em, 0).getTime();
      if (endMs > startMs) return Math.round((endMs - startMs) / (60 * 1000));
    }
    return null;
  })();

  // Valor puramente calculado a partir da duração (sem override manual)
  const calculatedFromDuration = (() => {
    if (isEditing) return null;
    if (
      hourlyRate != null &&
      hourlyRate > 0 &&
      effectiveDurationMinutes != null &&
      effectiveDurationMinutes > 0
    ) {
      return hourlyRate * (effectiveDurationMinutes / 60);
    }
    return null;
  })();

  // Valor efetivo: manual override ?? calculado
  const computedAmount = (() => {
    if (isEditing) return null;
    const manual = financialAmount ? parseMoneyToNumber(financialAmount) : null;
    if (manual != null && !isNaN(manual) && manual > 0) return manual;
    return calculatedFromDuration;
  })();

  useEffect(() => {
    if (open && classLog) {
      setSelectedStudentId(classLog.student_id);
      if (enableTeacherSelection) {
        const initialTeacherId =
          (classLog.teacher_id as string | null | undefined) ||
          (classLog.students?.teacher_id as string | null | undefined) ||
          "";

        if (initialTeacherId) {
          setSelectedTeacherId(initialTeacherId);
          setTeacherError(null);
        } else {
          setSelectedTeacherId("");
        }
      }
      setValue("student_id", classLog.student_id);
      setValue("class_date", isoDateToBr(classLog.class_date));
      setValue("title", classLog.title || "");
      setValue("observations", (classLog as { observations?: string | null }).observations || "");
      setValue("start_time", extractTimeFromIso(classLog.start_at));
      setValue("end_time", extractTimeFromIso(classLog.end_at));
    } else if (!open) {
      reset();
      setSelectedStudentId("");
      setSelectedTeacherId(teacherId || "");
      setTeacherError(null);
    }
  }, [open, classLog, reset, setValue, enableTeacherSelection, teacherId]);

  // Auto-fill due date when class date changes (só ao criar)
  useEffect(() => {
    if (!isEditing && classDate) {
      setValue("financial_due_date", classDate);
    }
  }, [classDate, isEditing, setValue]);

  // Auto-fill valor quando horário/duração muda (sempre atualiza com o calculado)
  useEffect(() => {
    if (!isEditing && calculatedFromDuration != null) {
      setValue("financial_amount", calculatedFromDuration.toFixed(2).replace(".", ","));
    }
  }, [isEditing, calculatedFromDuration, setValue]);

  const handleFormSubmit = (data: ClassLogFormData) => {
    if (enableTeacherSelection && !selectedTeacherId) {
      setTeacherError("Selecione um professor");
      return;
    }

    const effectiveTeacherId = teacherId || (enableTeacherSelection ? selectedTeacherId || null : null);
    const classDateIso = brDateToIso(data.class_date);

    const classLogData: ClassLogInsert = {
      student_id: data.student_id,
      class_date: classDateIso,
      title: data.title?.trim() || null,
      attendance: isEditing ? (classLog?.attendance ?? null) : null,
      grade: isEditing ? (classLog?.grade ?? null) : null,
      feedback: isEditing ? (classLog?.feedback ?? null) : null,
      observations: data.observations?.trim() || null,
      teacher_id: effectiveTeacherId,
      start_at:
        data.start_time && classDateIso
          ? buildTimestamptzFromDateAndTime(classDateIso, data.start_time)
          : null,
      end_at:
        data.end_time && classDateIso
          ? buildTimestamptzFromDateAndTime(classDateIso, data.end_time)
          : null,
      duration_minutes: effectiveDurationMinutes ?? null, // preenchido pelo trigger no DB se start_at/end_at presentes
      billed_amount:
        !isEditing && data.financial_amount
          ? (() => {
              const a = parseMoneyToNumber(data.financial_amount!);
              return !isNaN(a) && a > 0 ? a : null;
            })()
          : null,
    };

    // Criar aula com cobrança
    if (!isEditing && onSubmitWithFinancial && !data.semCobranca && data.financial_amount && data.financial_due_date) {
      const amount = parseMoneyToNumber(data.financial_amount);
      if (!isNaN(amount) && amount > 0) {
        onSubmitWithFinancial({
          classLog: classLogData,
          createFinancial: true,
          financialData: {
            amount,
            due_date: brDateToIso(data.financial_due_date),
            description: data.financial_description?.trim() || undefined,
            payment_method: data.financial_payment_method || null,
          },
        });
        return;
      }
    }

    // Edição ou criar sem cobrança
    onSubmit(classLogData);
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setValue("student_id", value);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Registro" : "Registrar Aula"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Teacher Select - only when enabled (admin) */}
          {enableTeacherSelection && (
            <div className="space-y-2">
              <Label>Professor *</Label>
              {isEditing && selectedTeacherId ? (
                <>
                  <Input
                    value={selectedTeacherName || "Professor não encontrado"}
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    Professor que registrou esta aula
                  </p>
                </>
              ) : (
                <>
                  <Select
                    value={selectedTeacherId}
                    onValueChange={(value) => {
                      setSelectedTeacherId(value);
                      setTeacherError(null);
                    }}
                    disabled={loadingTeachers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um professor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {teacherError && (
                    <p className="text-sm text-destructive">{teacherError}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Student Select */}
          <div className="space-y-2">
            <Label>Aluno *</Label>
            <Select
              value={selectedStudentId}
              onValueChange={handleStudentChange}
              disabled={loadingStudents || isEditing}
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

          {/* Título da Aula */}
          <div className="space-y-2">
            <Label htmlFor="title">Título da Aula</Label>
            <Input
              id="title"
              type="text"
              placeholder="Ex: Revisão de escalas maiores"
              {...register("title")}
            />
          </div>
          {/* Class Date */}
          <div className="space-y-2">
            <Label htmlFor="class_date">Data da Aula *</Label>
            <Input
              id="class_date"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="dd/mm/aaaa"
              {...register("class_date")}
              onChange={(e) => {
                const masked = maskDate(e.target.value);
                setValue("class_date", masked, { shouldValidate: true });
              }}
            />
            {errors.class_date && (
              <p className="text-sm text-destructive">{errors.class_date.message}</p>
            )}
          </div>

          {/* Início e término da aula */}
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Horário</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start_time">Início</Label>
                <Input id="start_time" type="time" {...register("start_time")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time">Término</Label>
                <Input id="end_time" type="time" {...register("end_time")} />
                {errors.end_time && (
                  <p className="text-xs text-destructive">{errors.end_time.message}</p>
                )}
              </div>
            </div>
            {effectiveDurationMinutes != null && (
              <p className="text-xs text-muted-foreground">
                Duração: {effectiveDurationMinutes} min
              </p>
            )}
          </div>

          {/* Observações pré-aula */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Notas pré-aula (opcional)..."
              rows={2}
              {...register("observations")}
            />
            {errors.observations && (
              <p className="text-sm text-destructive">{errors.observations.message}</p>
            )}
          </div>

          {/* Cobrança ao registrar aula */}
          {!isEditing && onSubmitWithFinancial && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="semCobranca"
                  checked={!!semCobranca}
                  onCheckedChange={(checked) =>
                    setValue("semCobranca", !!checked, { shouldValidate: true })
                  }
                />
                <Label htmlFor="semCobranca" className="cursor-pointer font-normal">
                  Sem cobrança
                </Label>
              </div>
              {!semCobranca && (
            <div className="space-y-4 rounded-lg border p-4 bg-accent/20">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Dados da Cobrança *
                  </h4>
                  {isFutureDate && (
                    <p className="text-xs text-muted-foreground">
                      Para aula agendada: a cobrança fica em aberto; presença e feedback podem ser marcados depois.
                    </p>
                  )}

                  {/* Preview do valor calculado */}
                  {computedAmount != null ? (
                    <p className="text-sm text-muted-foreground">
                      Valor calculado: <span className="font-semibold text-foreground">{formatCurrency(computedAmount)}</span>
                      {effectiveDurationMinutes && hourlyRate ? (
                        <span className="ml-1">
                          ({formatCurrency(hourlyRate)}/h × {effectiveDurationMinutes} min)
                        </span>
                      ) : null}
                    </p>
                  ) : hourlyRate == null || hourlyRate <= 0 ? (
                    <p className="text-sm text-amber-600">
                      Aluno sem valor/hora cadastrado. Informe o valor manualmente.
                    </p>
                  ) : !effectiveDurationMinutes ? (
                    <p className="text-sm text-muted-foreground">
                      Informe início e término para calcular o valor.
                    </p>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="financial_amount">Valor (R$) *</Label>
                      <Input
                        id="financial_amount"
                        type="text"
                        placeholder="100,00"
                        {...register("financial_amount")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="financial_due_date">Vencimento *</Label>
                      <Input
                        id="financial_due_date"
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="dd/mm/aaaa"
                        {...register("financial_due_date")}
                        onChange={(e) => {
                          const masked = maskDate(e.target.value);
                          setValue("financial_due_date", masked, { shouldValidate: true });
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="financial_description">Descrição</Label>
                    <Input
                      id="financial_description"
                      type="text"
                      placeholder="Aula de piano - Janeiro"
                      {...register("financial_description")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Se não preenchido, será "Aula do dia [data]"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="financial_payment_method">Método de Pagamento</Label>
                    <Select
                      onValueChange={(value) => setValue("financial_payment_method", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Registrar Aula"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
