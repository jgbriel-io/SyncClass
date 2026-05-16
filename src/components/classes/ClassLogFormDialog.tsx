import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { ClassLogInsert, ClassLogWithStudent, ClassLogWithFinancialData } from "@/hooks/useClassLogs";
import { isValidDateString, parseMoneyToNumber, REGEX_PATTERNS } from "@/lib/utils/patterns";
import { brDateToIso, buildTimestamptzFromDateAndTime as buildTimestamptz, getDefaultDueDateForClassLog } from "@/lib/utils/classFormHelpers";
import { ClassLogStudentSection } from "./ClassLogStudentSection";
import { ClassLogFinancialSection } from "./ClassLogFinancialSection";
import { classes as classesContent, common } from "@/content";

// ─── Helpers locais ───────────────────────────────────────────────────────────

function isoDateToBr(value: string): string {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

function isDateFuture(brDate: string): boolean {
  if (!brDate || !REGEX_PATTERNS.date.test(brDate)) return false;
  const iso = brDateToIso(brDate);
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

function getDefaultDueDateForClassMonth(classDateBr: string, payDay: number | null): string {
  return getDefaultDueDateForClassLog(classDateBr, payDay, REGEX_PATTERNS.date);
}

function extractTimeFromIso(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const classLogBaseSchema = z.object({
  student_id: z.string().min(1, classesContent.validation.studentRequired),
  class_date: z.string()
    .min(1, classesContent.validation.dateRequired)
    .regex(REGEX_PATTERNS.date, classesContent.validation.dateFormat)
    .refine(isValidDateString, { message: classesContent.validation.dateInvalid })
    .refine((val) => {
      if (!val || !REGEX_PATTERNS.date.test(val)) return true;
      const [, , year] = val.split("/").map(Number);
      return year >= 2026;
    }, { message: classesContent.validation.dateMinYear }),
  title: z.string().optional(),
  feedback: z.string().max(1000).optional(),
  observations: z.string().max(1000, classesContent.validation.observationsMaxLength).optional(),
  start_time: z.string().optional().refine((v) => !v || REGEX_PATTERNS.time.test(v), { message: classesContent.validation.timeFormat }),
  end_time: z.string().optional().refine((v) => !v || REGEX_PATTERNS.time.test(v), { message: classesContent.validation.timeFormat }),
  grade: z.number({ invalid_type_error: classesContent.validation.gradeRange }).min(0).max(100).optional().nullable(),
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
  { message: classesContent.validation.endTimeAfterStart, path: ["end_time"] }
);

function createClassLogSchema(isEditing: boolean) {
  return classLogBaseSchema
    .refine(
      (data) => {
        if (isEditing || data.semCobranca) return true;
        const a = parseMoneyToNumber(data.financial_amount || "");
        return !isNaN(a) && a > 0;
      },
      { message: classesContent.validation.amountRequired, path: ["financial_amount"] }
    )
    .refine(
      (data) => {
        if (isEditing || data.semCobranca) return true;
        return !!(data.financial_due_date && data.financial_due_date.trim());
      },
      { message: classesContent.validation.dueDateRequired, path: ["financial_due_date"] }
    );
}

type ClassLogFormData = z.infer<ReturnType<typeof createClassLogSchema>>;

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface ClassLogFinancialUpdate {
  financialRecordId: string;
  dueDate: string;
  amount?: number;
}

interface ClassLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classLog?: ClassLogWithStudent | null;
  onSubmit: (data: ClassLogInsert, financialUpdate?: ClassLogFinancialUpdate) => void;
  teacherId?: string;
  onSubmitWithFinancial?: (data: ClassLogWithFinancialData) => void;
  isLoading: boolean;
  enableTeacherSelection?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ClassLogFormDialog({
  open,
  onOpenChange,
  classLog,
  onSubmit,
  onSubmitWithFinancial,
  isLoading,
  teacherId,
  enableTeacherSelection,
}: ClassLogFormDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teacherId || "");
  const [teacherError, setTeacherError] = useState<string | null>(null);

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const activeStudents = students.filter((s) => s.status === "ativo");
  const isEditing = !!classLog;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<ClassLogFormData>({
      resolver: zodResolver(createClassLogSchema(isEditing)),
      defaultValues: { semCobranca: false },
    });

  const classDate = watch("class_date");
  const startTime = watch("start_time");
  const endTime = watch("end_time");
  const financialAmount = watch("financial_amount");

  const selectedStudent = activeStudents.find((s) => s.id === selectedStudentId);
  const hourlyRate = selectedStudent?.hourly_rate ?? null;

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

  const calculatedFromDuration = (() => {
    if (hourlyRate != null && hourlyRate > 0 && effectiveDurationMinutes != null && effectiveDurationMinutes > 0) {
      return hourlyRate * (effectiveDurationMinutes / 60);
    }
    return null;
  })();

  const computedAmount = (() => {
    const manual = financialAmount ? parseMoneyToNumber(financialAmount) : null;
    if (manual != null && !isNaN(manual) && manual > 0) return manual;
    return calculatedFromDuration;
  })();

  // Preencher formulário ao editar
  useEffect(() => {
    if (open && classLog) {
      setSelectedStudentId(classLog.student_id);
      if (enableTeacherSelection) {
        const initialTeacherId =
          (classLog.teacher_id as string | null | undefined) ||
          (classLog.students?.teacher_id as string | null | undefined) ||
          "";
        setSelectedTeacherId(initialTeacherId || "");
        setTeacherError(null);
      }
      setValue("student_id", classLog.student_id);
      setValue("class_date", isoDateToBr(classLog.class_date));
      setValue("title", classLog.title || "");
      setValue("observations", (classLog as { observations?: string | null }).observations || "");
      setValue("start_time", extractTimeFromIso(classLog.start_at));
      setValue("end_time", extractTimeFromIso(classLog.end_at));

      const hasDirectFinancial =
        classLog.financial_records?.length > 0 && classLog.financial_records[0];
      const hasPackageFinancial =
        classLog.financial_record_class_logs?.length > 0 &&
        classLog.financial_record_class_logs[0]?.financial_records;

      if (hasDirectFinancial) {
        if (classLog.financial_records[0].due_date)
          setValue("financial_due_date", isoDateToBr(classLog.financial_records[0].due_date));
        if (classLog.financial_records[0].amount != null)
          setValue("financial_amount", Number(classLog.financial_records[0].amount).toFixed(2).replace(".", ","));
      } else if (hasPackageFinancial) {
        const pf = classLog.financial_record_class_logs[0].financial_records;
        if (pf.due_date) setValue("financial_due_date", isoDateToBr(pf.due_date));
        if (pf.amount != null) setValue("financial_amount", Number(pf.amount).toFixed(2).replace(".", ","));
      }
    } else if (!open) {
      reset();
      setSelectedStudentId("");
      setSelectedTeacherId(teacherId || "");
      setTeacherError(null);
    }
  }, [open, classLog, reset, setValue, enableTeacherSelection, teacherId]);

  // Vencimento padrão ao criar
  useEffect(() => {
    if (!isEditing && classDate && selectedStudent) {
      const due = getDefaultDueDateForClassMonth(classDate, selectedStudent.pay_day ?? null);
      setValue("financial_due_date", due);
    }
  }, [classDate, isEditing, selectedStudent, setValue]);

  // Auto-fill valor quando duração muda
  useEffect(() => {
    if (calculatedFromDuration != null) {
      setValue("financial_amount", calculatedFromDuration.toFixed(2).replace(".", ","));
    }
  }, [calculatedFromDuration, setValue]);

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
      start_at: data.start_time && classDateIso ? buildTimestamptz(classDateIso, data.start_time) : null,
      end_at: data.end_time && classDateIso ? buildTimestamptz(classDateIso, data.end_time) : null,
      duration_minutes: effectiveDurationMinutes ?? null,
      billed_amount: (() => {
        const a = data.financial_amount ? parseMoneyToNumber(data.financial_amount) : null;
        return a != null && !isNaN(a) && a > 0 ? a : null;
      })(),
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

    // Edição: atualizar cobrança vinculada se existir
    const hasDirectFinancial = classLog?.financial_records?.length > 0 && classLog.financial_records[0]?.id;
    const hasPackageFinancial =
      classLog?.financial_record_class_logs?.length > 0 &&
      classLog.financial_record_class_logs[0]?.financial_records?.id;

    if (isEditing && (hasDirectFinancial || hasPackageFinancial)) {
      const financialId = hasDirectFinancial
        ? classLog.financial_records[0].id
        : classLog.financial_record_class_logs![0].financial_records.id;
      const currentDueDate = hasDirectFinancial
        ? classLog.financial_records[0].due_date
        : classLog.financial_record_class_logs![0].financial_records.due_date;
      const dueDate = data.financial_due_date?.trim()
        ? brDateToIso(data.financial_due_date)
        : (currentDueDate ?? "");
      const amount = data.financial_amount ? parseMoneyToNumber(data.financial_amount) : undefined;
      onSubmit(classLogData, {
        financialRecordId: financialId,
        dueDate,
        ...(amount != null && !isNaN(amount) && amount > 0 && { amount }),
      });
    } else {
      onSubmit(classLogData);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? classesContent.logFormDialog.titleEdit : classesContent.logFormDialog.titleNew}
      size="SM"
      scrollable={true}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <ClassLogStudentSection
          register={register}
          setValue={setValue}
          watch={watch}
          errors={errors}
          isEditing={isEditing}
          enableTeacherSelection={enableTeacherSelection}
          selectedStudentId={selectedStudentId}
          selectedTeacherId={selectedTeacherId}
          teacherError={teacherError}
          activeStudents={activeStudents}
          teachers={teachers}
          loadingStudents={loadingStudents}
          loadingTeachers={loadingTeachers}
          effectiveDurationMinutes={effectiveDurationMinutes}
          onStudentChange={(value) => {
            setSelectedStudentId(value);
            setValue("student_id", value);
          }}
          onTeacherChange={(value) => {
            setSelectedTeacherId(value);
            setTeacherError(null);
          }}
        />

        {onSubmitWithFinancial && (
          <ClassLogFinancialSection
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            isEditing={isEditing}
            classLog={classLog}
            enableCreate={!!onSubmitWithFinancial}
            isFutureDate={isDateFuture(classDate || "")}
            computedAmount={computedAmount}
            effectiveDurationMinutes={effectiveDurationMinutes}
            hourlyRate={hourlyRate}
          />
        )}

        {/* Editar cobrança existente (sem onSubmitWithFinancial) */}
        {isEditing && !onSubmitWithFinancial && (
          <ClassLogFinancialSection
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            isEditing={isEditing}
            classLog={classLog}
            enableCreate={false}
            isFutureDate={false}
            computedAmount={null}
            effectiveDurationMinutes={null}
            hourlyRate={null}
          />
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {classesContent.logFormDialog.cancel}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {classesContent.logFormDialog.submitting}
              </>
            ) : isEditing ? (
              classesContent.logFormDialog.submitButton
            ) : (
              classesContent.logFormDialog.titleNew
            )}
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
