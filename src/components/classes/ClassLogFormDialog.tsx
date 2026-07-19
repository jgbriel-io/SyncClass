import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import {
  ClassLogInsert,
  ClassLogWithStudent,
  ClassLogWithFinancialData,
} from "@/hooks/useClassLogs";
import { parseMoneyToNumber } from "@/lib/utils/patterns";
import {
  brDateToIso,
  buildTimestamptzFromDateAndTime as buildTimestamptz,
} from "@/lib/utils/classFormHelpers";
import { ClassLogStudentSection } from "./ClassLogStudentSection";
import { ClassLogFinancialSection } from "./ClassLogFinancialSection";
import { useClassLogCalculations } from "./useClassLogCalculations";
import { classes as classesContent, common } from "@/content";
import {
  isoDateToBr,
  isDateFuture,
  getDefaultDueDateForClassMonth,
  extractTimeFromIso,
  createClassLogSchema,
  type ClassLogFormData,
  type ClassLogFinancialUpdate,
} from "./ClassLogFormDialog.schema";

export type { ClassLogFinancialUpdate };

interface ClassLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classLog?: ClassLogWithStudent | null;
  onSubmit: (
    data: ClassLogInsert,
    financialUpdate?: ClassLogFinancialUpdate
  ) => void;
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
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teacherId || ""
  );
  const [teacherError, setTeacherError] = useState<string | null>(null);

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
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
    defaultValues: { semCobranca: classLog?.sem_cobranca ?? false },
  });

  const classDate = watch("class_date");
  const startTime = watch("start_time");
  const endTime = watch("end_time");
  const financialAmount = watch("financial_amount");

  const selectedStudent = activeStudents.find(
    (s) => s.id === selectedStudentId
  );
  const hourlyRate = selectedStudent?.hourly_rate ?? null;

  const { effectiveDurationMinutes, computedAmount } = useClassLogCalculations({
    classDate,
    startTime,
    endTime,
    hourlyRate,
    financialAmount,
  });

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
      setValue(
        "observations",
        (classLog as { observations?: string | null }).observations || ""
      );
      setValue("start_time", extractTimeFromIso(classLog.start_at));
      setValue("end_time", extractTimeFromIso(classLog.end_at));
      setValue(
        "semCobranca",
        (classLog as { sem_cobranca?: boolean | null }).sem_cobranca ?? false
      );

      const hasDirectFinancial =
        classLog.financial_records?.length > 0 && classLog.financial_records[0];
      const hasPackageFinancial =
        classLog.financial_record_class_logs?.length > 0 &&
        classLog.financial_record_class_logs[0]?.financial_records;

      if (hasDirectFinancial) {
        if (classLog.financial_records[0].due_date)
          setValue(
            "financial_due_date",
            isoDateToBr(classLog.financial_records[0].due_date)
          );
        if (classLog.financial_records[0].amount != null)
          setValue(
            "financial_amount",
            Number(classLog.financial_records[0].amount)
              .toFixed(2)
              .replace(".", ",")
          );
      } else if (hasPackageFinancial) {
        const pf = classLog.financial_record_class_logs[0].financial_records;
        if (pf.due_date)
          setValue("financial_due_date", isoDateToBr(pf.due_date));
        if (pf.amount != null)
          setValue(
            "financial_amount",
            Number(pf.amount).toFixed(2).replace(".", ",")
          );
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
      const due = getDefaultDueDateForClassMonth(
        classDate,
        selectedStudent.pay_day ?? null
      );
      setValue("financial_due_date", due);
    }
  }, [classDate, isEditing, selectedStudent, setValue]);

  // Auto-fill valor quando duração muda
  useEffect(() => {
    if (
      hourlyRate != null &&
      hourlyRate > 0 &&
      effectiveDurationMinutes != null &&
      effectiveDurationMinutes > 0
    ) {
      const calc = hourlyRate * (effectiveDurationMinutes / 60);
      setValue("financial_amount", calc.toFixed(2).replace(".", ","));
    }
  }, [effectiveDurationMinutes, hourlyRate, setValue]);

  const handleFormSubmit = (data: ClassLogFormData) => {
    if (enableTeacherSelection && !selectedTeacherId) {
      setTeacherError(classesContent.validation.teacherRequired);
      return;
    }

    const effectiveTeacherId =
      teacherId || (enableTeacherSelection ? selectedTeacherId || null : null);
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
          ? buildTimestamptz(classDateIso, data.start_time)
          : null,
      end_at:
        data.end_time && classDateIso
          ? buildTimestamptz(classDateIso, data.end_time)
          : null,
      duration_minutes: effectiveDurationMinutes ?? null,
      billed_amount: (() => {
        const a = data.financial_amount
          ? parseMoneyToNumber(data.financial_amount)
          : null;
        return a != null && !isNaN(a) && a > 0 ? a : null;
      })(),
    };

    // Criar aula com cobrança
    if (
      !isEditing &&
      onSubmitWithFinancial &&
      !data.semCobranca &&
      data.financial_amount &&
      data.financial_due_date
    ) {
      const amount = parseMoneyToNumber(data.financial_amount);
      if (!isNaN(amount) && amount > 0) {
        onSubmitWithFinancial({
          classLog: classLogData,
          createFinancial: true,
          financialData: {
            amount,
            due_date: brDateToIso(data.financial_due_date),
            description: data.financial_description?.trim() || undefined,
          },
        });
        return;
      }
    }

    // Edição: atualizar cobrança vinculada se existir
    const hasDirectFinancial =
      classLog?.financial_records?.length > 0 &&
      classLog.financial_records[0]?.id;
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
      const amount = data.financial_amount
        ? parseMoneyToNumber(data.financial_amount)
        : undefined;
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
      title={
        isEditing
          ? classesContent.logFormDialog.titleEdit
          : classesContent.logFormDialog.titleNew
      }
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
