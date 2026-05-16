import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
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
import { Loader2, CalendarIcon } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useAvailableClassLogsForStudent } from "@/hooks/useClassLogs";
import { FinancialRecordInsert, FinancialRecord, FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { brDateStringToDate, isValidDateString, parseMoneyToNumber, formatNumberToMoneyBR, REGEX_PATTERNS } from "@/lib/utils/patterns";
import { cn } from "@/lib/utils";
import { common, financial } from "@/content";

function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}
function createFinancialSchema(requireClassLog: boolean) {
  return z.object({
    student_id: z.string().min(1, financial.validation.studentRequired),
    class_log_id: requireClassLog
      ? z.string().min(1, financial.validation.classLogRequired)
      : z.string().optional(),
    amount: z.string().min(1, financial.validation.amountRequired),
    due_date: z.string()
      .min(1, financial.validation.dueDateRequired)
      .regex(REGEX_PATTERNS.date, financial.validation.dueDateFormat)
      .refine(isValidDateString, { message: financial.validation.dueDateInvalid }),
    payment_method: z.string().optional(),
    description: z.string().optional(),
  });
}

type FinancialFormData = z.infer<ReturnType<typeof createFinancialSchema>>;

interface FinancialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FinancialRecordInsert) => void;
  isLoading: boolean;
  initialData?: FinancialRecord | FinancialRecordWithRelations | null;
  enableTeacherSelection?: boolean;
}

function formatClassLogDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

export function FinancialFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialData,
  enableTeacherSelection,
}: FinancialFormDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedClassLogId, setSelectedClassLogId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const { data: availableClassLogs = [], isLoading: loadingClassLogs } = useAvailableClassLogsForStudent(
    selectedStudentId || null,
    enableTeacherSelection ? (selectedTeacherId || undefined) : undefined
  );

  const requireClassLog = !initialData;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FinancialFormData>({
    resolver: zodResolver(createFinancialSchema(requireClassLog)),
  });

  const dueDate = watch("due_date");

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedStudentId("");
      setSelectedClassLogId("");
      setSelectedTeacherId("");
      setTeacherError(null);
    } else if (open && !initialData) {
      // Nova cobrança: limpa tudo ao abrir
      reset();
      setSelectedStudentId("");
      setSelectedClassLogId("");
      setSelectedTeacherId("");
      setTeacherError(null);
    }
  }, [open, reset, initialData]);

  useEffect(() => {
    if (open && initialData) {
      setSelectedStudentId(initialData.student_id || "");
      setSelectedClassLogId(initialData.class_log_id || "");
      
      // Garantir que o amount seja formatado corretamente com separador de milhar
      const amountValue = initialData.amount ? Number(initialData.amount) : 0;
      const formattedAmount = formatNumberToMoneyBR(amountValue);
      
      reset({
        student_id: initialData.student_id || "",
        class_log_id: initialData.class_log_id || "",
        amount: formattedAmount,
        due_date: initialData.due_date ? format(new Date(initialData.due_date + "T00:00:00"), "dd/MM/yyyy") : "",
        description: initialData.description || "",
        payment_method: initialData.payment_method || "",
      });
    }
  }, [open, initialData, reset]);

  // Reset class log when student changes
  useEffect(() => {
    setSelectedClassLogId("");
    setValue("class_log_id", "");
  }, [selectedStudentId, setValue]);

  const handleFormSubmit = (data: FinancialFormData) => {
    // Para admin, professor é obrigatório
    if (enableTeacherSelection && !selectedTeacherId) {
      setTeacherError(financial.validation.studentRequired);
      return;
    }

    const amount = parseMoneyToNumber(data.amount);
    
    onSubmit({
      student_id: data.student_id,
      // Preservar class_log_id original ao editar
      class_log_id: initialData ? (initialData.class_log_id || null) : (data.class_log_id || null),
      amount: amount,
      due_date: brDateToIso(data.due_date),
      payment_method: data.payment_method || null,
      description: data.description || null,
      status: "pendente",
    });
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setValue("student_id", value);
  };

  const handleClassLogChange = (value: string) => {
    setSelectedClassLogId(value);
    setValue("class_log_id", value);
  };

  // Filter only active students
  const activeStudents = students.filter((s) => s.status === "ativo");

  // Ao editar, a aula atual não aparece em availableClassLogs (já tem cobrança); incluir para exibição
  const currentClassLog =
    initialData && "class_logs" in initialData && initialData.class_logs
      ? {
          id: initialData.class_logs.id,
          class_date: initialData.class_logs.class_date,
          attendance: initialData.class_logs.attendance,
          grade: initialData.class_logs.grade,
          title: initialData.class_logs.title,
        }
      : null;
  
  // Para cobranças de pacote, pegar a primeira aula do pacote
  const packageClasses = initialData && "package_classes" in initialData ? initialData.package_classes : null;
  const isPackage = !initialData?.class_log_id && packageClasses && packageClasses.length > 0;
  
  const classLogOptions =
    currentClassLog && !availableClassLogs.some((a) => a.id === currentClassLog.id)
      ? [currentClassLog, ...availableClassLogs]
      : availableClassLogs;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? financial.formDialog.titleEdit : financial.formDialog.titleNew}
      size="SM"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Teacher Select - only when enabled (admin) */}
          {enableTeacherSelection && (
            <div className="space-y-2">
              <Label>{financial.formDialog.teacherLabel}</Label>
              {initialData && selectedTeacherId ? (
                <>
                  <Input
                    value={teachers.find(t => t.id === selectedTeacherId)?.name || common.labels.teacherNotFound}
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    {financial.formDialog.teacherLinked}
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
                      <SelectValue placeholder={financial.formDialog.teacherPlaceholder} />
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
            <Label>{financial.formDialog.studentLabel}</Label>
            <Select
              value={selectedStudentId}
              onValueChange={handleStudentChange}
              disabled={loadingStudents || !!initialData}
            >
              <SelectTrigger>
                <SelectValue placeholder={financial.formDialog.studentPlaceholder} />
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

          {/* Class Log Select */}
          <div className="space-y-2">
            <Label>{financial.formDialog.classLabel}</Label>
            {initialData ? (
              // Ao editar: mostrar input travado com o título da aula
              <Input
                value={
                  isPackage && packageClasses
                    ? (() => {
                        const firstClass = packageClasses[0];
                        const rawTitle = firstClass.title?.trim();
                        const displayTitle = rawTitle || `${financial.formDialog.classDatePrefix}${formatClassLogDate(firstClass.class_date)}`;
                        return `${displayTitle} ${financial.formDialog.packageLabel}`;
                      })()
                    : currentClassLog
                      ? (() => {
                          const rawTitle = currentClassLog.title?.trim();
                          return rawTitle || `${financial.formDialog.classDatePrefix}${formatClassLogDate(currentClassLog.class_date)}`;
                        })()
                      : financial.formDialog.noClassLinked
                }
                disabled
                className="bg-muted"
              />
            ) : (
              // Ao criar: mostrar select normal
              <Select
                value={selectedClassLogId || undefined}
                onValueChange={handleClassLogChange}
                disabled={!selectedStudentId || loadingClassLogs || (requireClassLog && classLogOptions.length === 0)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedStudentId 
                      ? financial.formDialog.classSelectStudentFirst
                      : loadingClassLogs 
                        ? financial.formDialog.classLoading
                        : requireClassLog && classLogOptions.length === 0
                          ? financial.formDialog.classNone
                          : financial.formDialog.classSelect
                  } />
                </SelectTrigger>
                <SelectContent>
                  {classLogOptions.map((log) => (
                    <SelectItem key={log.id} value={log.id}>
                      {formatClassLogDate(log.class_date)}
                      {log.attendance === false && ` (${financial.tableRow.absence})`}
                      {log.grade && ` - ${financial.tableRow.grade} ${log.grade}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedStudentId && classLogOptions.length === 0 && !loadingClassLogs && !initialData && (
              <p className="text-xs text-muted-foreground">
                {financial.formDialog.classNoneWithCharge}
              </p>
            )}
            {errors.class_log_id && (
              <p className="text-sm text-destructive">{errors.class_log_id.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{financial.formDialog.amountLabel}</Label>
            <Input
              id="amount"
              type="text"
              placeholder={financial.formDialog.amountPlaceholder}
              {...register("amount")}
              onChange={(e) => {
                const value = e.target.value;
                const numericValue = parseMoneyToNumber(value);
                if (!isNaN(numericValue)) {
                  const formatted = formatNumberToMoneyBR(numericValue);
                  setValue("amount", formatted);
                }
              }}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">{financial.formDialog.dueDateLabel}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="due_date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate || financial.formDialog.selectDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={brDateStringToDate(dueDate || "") ?? undefined}
                  onSelect={(date) => {
                    if (date) {
                      setValue("due_date", format(date, "dd/MM/yyyy", { locale: ptBR }), { shouldValidate: true });
                    }
                  }}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.due_date && (
              <p className="text-sm text-destructive">{errors.due_date.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{financial.formDialog.descriptionLabel}</Label>
            <Textarea
              id="description"
              placeholder={financial.formDialog.descriptionPlaceholder}
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">{financial.formDialog.paymentMethodLabel}</Label>
            <Select
              value={watch("payment_method") || undefined}
              onValueChange={(value) => setValue("payment_method", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={financial.formDialog.paymentMethodPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">{financial.formDialog.pix}</SelectItem>
                <SelectItem value="cartao">{financial.formDialog.card}</SelectItem>
                <SelectItem value="dinheiro">{financial.formDialog.cash}</SelectItem>
                <SelectItem value="transferencia">{financial.formDialog.transfer}</SelectItem>
                <SelectItem value="outro">{financial.formDialog.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {financial.formDialog.cancel}
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                (requireClassLog && (!selectedClassLogId || classLogOptions.length === 0))
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {financial.formDialog.submitting}
                </>
              ) : initialData ? (
                financial.formDialog.saveChanges
              ) : (
                financial.formDialog.create
              )}
            </Button>
          </div>
        </form>
    </BaseDialog>
  );
}
