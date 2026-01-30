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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Receipt } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { ClassLogInsert, ClassLogWithStudent, ClassLogWithFinancialData } from "@/hooks/useClassLogs";
import { maskDate, isValidDateString, parseMoneyToNumber } from "@/lib/utils/patterns";

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
const classLogSchema = z.object({
  student_id: z.string().min(1, "Selecione um aluno"),
  class_date: z.string()
    .min(1, "Informe a data da aula")
    .regex(dateRegex, "Formato deve ser dd/mm/aaaa")
    .refine(isValidDateString, { message: "Data inválida" }),
  title: z.string().optional(),
  attendance: z.boolean(),
  grade: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseMoneyToNumber(val);
      return !isNaN(num) && num >= 0 && num <= 10;
    }, {
      message: "Nota deve ser entre 0 e 10",
    }),
  feedback: z.string().max(1000, "Feedback deve ter no máximo 1000 caracteres").optional(),
  // Campos de cobrança
  createFinancial: z.boolean().optional(),
  financial_amount: z.string().optional(),
  financial_due_date: z.string().optional().refine(
    (val) => !val || isValidDateString(val),
    { message: "Data inválida" }
  ),
  financial_description: z.string().optional(),
  financial_payment_method: z.string().optional(),
});

type ClassLogFormData = z.infer<typeof classLogSchema>;

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
  const [attendance, setAttendance] = useState(true);
  const [createFinancial, setCreateFinancial] = useState(false);
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const selectedTeacherName = teachers.find((t: Teacher) => t.id === selectedTeacherId)?.name;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassLogFormData>({
    resolver: zodResolver(classLogSchema),
    defaultValues: {
      attendance: true,
      createFinancial: false,
    },
  });

  const classDate = watch("class_date");

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
      setAttendance(classLog.attendance ?? true);
      setCreateFinancial(false);
      setValue("student_id", classLog.student_id);
      setValue("class_date", isoDateToBr(classLog.class_date));
      setValue("attendance", classLog.attendance ?? true);
      setValue("title", classLog.title || "");
      setValue("grade", classLog.grade?.toString() || "");
      setValue("feedback", classLog.feedback || "");
      setValue("createFinancial", false);
    } else if (!open) {
      reset();
      setSelectedStudentId("");
      setSelectedTeacherId(teacherId || "");
      setAttendance(true);
      setCreateFinancial(false);
      setTeacherError(null);
    }
  }, [open, classLog, reset, setValue, enableTeacherSelection, teacherId]);

  // Auto-fill due date when class date changes
  useEffect(() => {
    if (classDate && createFinancial) {
      setValue("financial_due_date", classDate);
    }
  }, [classDate, createFinancial, setValue]);

  const handleFormSubmit = (data: ClassLogFormData) => {
    // Se a tela exige seleção de professor (admin), bloqueia sem professor
    if (enableTeacherSelection && !selectedTeacherId) {
      setTeacherError("Selecione um professor");
      return;
    }
    let grade: number | null = null;
    if (data.grade && data.attendance) {
      const parsed = parseMoneyToNumber(data.grade);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
        grade = parsed;
      }
    }

    const effectiveTeacherId = teacherId || (enableTeacherSelection ? selectedTeacherId || null : null);

    const classLogData: ClassLogInsert = {
      student_id: data.student_id,
      class_date: brDateToIso(data.class_date),
      title: data.title?.trim() || null,
      attendance: data.attendance,
      grade: data.attendance ? grade : null,
      feedback: data.feedback?.trim() || null,
      teacher_id: effectiveTeacherId,
    };

    // Se está criando cobrança junto
    if (createFinancial && onSubmitWithFinancial && data.financial_amount && data.financial_due_date) {
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

    onSubmit(classLogData);
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setValue("student_id", value);
  };

  const handleAttendanceChange = (checked: boolean) => {
    setAttendance(checked);
    setValue("attendance", checked);
    if (!checked) {
      setValue("grade", "");
    }
  };

  const handleCreateFinancialChange = (checked: boolean) => {
    setCreateFinancial(checked);
    setValue("createFinancial", checked);
    if (checked && classDate) {
      setValue("financial_due_date", classDate);
    }
  };

  // Filter only active students
  const activeStudents = students.filter((s) => s.status === "ativo");
  const isEditing = !!classLog;

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

          {/* Attendance Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="attendance">Presença</Label>
              <p className="text-sm text-muted-foreground">
                O aluno compareceu à aula?
              </p>
            </div>
            <Switch
              id="attendance"
              checked={attendance}
              onCheckedChange={handleAttendanceChange}
            />
          </div>

          {/* Grade - only show if present */}
          {attendance && (
            <div className="space-y-2">
              <Label htmlFor="grade">Nota (0 a 10)</Label>
              <Input
                id="grade"
                type="text"
                placeholder="8.5"
                {...register("grade")}
              />
              {errors.grade ? (
                <p className="text-xs text-destructive">
                  {errors.grade.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Deixe em branco se não houver avaliação
                </p>
              )}
            </div>
          )}

          {/* Feedback */}
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

          {/* Create Financial Checkbox - only for new records */}
          {!isEditing && onSubmitWithFinancial && (
            <>
              <div className="flex items-center space-x-3 rounded-lg border border-dashed p-4 bg-muted/30">
                <Checkbox
                  id="createFinancial"
                  checked={createFinancial}
                  onCheckedChange={(checked) => handleCreateFinancialChange(checked === true)}
                />
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="createFinancial" className="cursor-pointer font-medium">
                    Criar cobrança para esta aula
                  </Label>
                </div>
              </div>

              {/* Financial Fields - show when checkbox is checked */}
              {createFinancial && (
                <div className="space-y-4 rounded-lg border p-4 bg-accent/20">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Dados da Cobrança
                  </h4>

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
            </>
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
              ) : createFinancial ? (
                "Registrar Aula e Cobrança"
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
