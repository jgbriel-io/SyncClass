import { useState, useEffect } from "react";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import {
  useCreateClassLogPackage,
  CreateClassLogPackageItem,
  CreateClassLogPackagePayload,
  ClassLogInsert,
} from "@/hooks/useClassLogs";
import { REGEX_PATTERNS, isValidDateString } from "@/lib/utils/patterns";
import { toast } from "sonner";
import { brDateToIso, buildTimestamptzFromDateAndTime as buildTimestamptz, getDefaultDueDateForPackage } from "@/lib/utils/classFormHelpers";
import { PackageSlotList, type Slot, type ScheduleMode } from "./PackageSlotList";
import { PackageFinancialSection } from "./PackageFinancialSection";
import { classes as classesContent, common } from "@/content";

// ─── Helpers locais ───────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

function getDefaultDueDateForClassMonth(classDateBr: string, payDay: number | null): string {
  return getDefaultDueDateForPackage(classDateBr, payDay, REGEX_PATTERNS.date);
}

function isDateTodayOrFuture(brDate: string): boolean {
  if (!brDate || !REGEX_PATTERNS.date.test(brDate)) return false;
  const [day, month, year] = brDate.split("/").map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= today;
}

const emptySlot: Slot = { class_date: "", start_time: "", end_time: "" };

// ─── Props ────────────────────────────────────────────────────────────────────

interface PackageClassesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId?: string;
  enableTeacherSelection?: boolean;
  /** Aluno já selecionado (ex.: vindo do perfil do aluno) */
  initialStudentId?: string | null;
  onSuccess?: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PackageClassesDialog({
  open,
  onOpenChange,
  teacherId,
  enableTeacherSelection = true,
  initialStudentId,
  onSuccess,
}: PackageClassesDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherId || "");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [semCobranca, setSemCobranca] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("fixed");
  const [fixedMonth, setFixedMonth] = useState<number>(0);
  const [fixedYear, setFixedYear] = useState<number>(2026);
  const [fixedWeekdays, setFixedWeekdays] = useState<number[]>([]);
  const [fixedStartTime, setFixedStartTime] = useState("");
  const [fixedEndTime, setFixedEndTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([{ ...emptySlot }]);

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const activeStudents = students.filter((s) => s.status === "ativo");
  const selectedStudent = activeStudents.find((s) => s.id === studentId);
  const createPackage = useCreateClassLogPackage();

  const resetForm = () => {
    setStudentId("");
    setSelectedTeacherId(teacherId ?? "");
    setSlots([{ ...emptySlot }]);
    setSemCobranca(false);
    setPaymentMethod("");
    setScheduleMode("fixed");
    setFixedMonth(0);
    setFixedYear(2026);
    setFixedWeekdays([]);
    setFixedStartTime("");
    setFixedEndTime("");
    setTeacherError(null);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open, teacherId]);

  useEffect(() => {
    if (open) {
      resetForm();
      setStudentId(initialStudentId ?? "");
      setSelectedTeacherId(teacherId ?? "");
    }
  }, [open, initialStudentId, teacherId]);

  const validate = (): string | null => {
    if (enableTeacherSelection && !selectedTeacherId) return common.errors.selectTeacher;
    if (!studentId) return common.errors.selectStudent;
    if (slots.length === 0)
      return "Adicione ao menos uma aula ou use Horário fixo para gerar as aulas do mês.";
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.class_date?.trim()) return `Informe a data da aula ${i + 1}.`;
      if (!REGEX_PATTERNS.date.test(s.class_date)) return `Data inválida na aula ${i + 1}.`;
      if (!isValidDateString(s.class_date)) return `Data inválida na aula ${i + 1}.`;
      if (!isDateTodayOrFuture(s.class_date))
        return `A data da aula ${i + 1} deve ser de hoje em diante.`;
      if (!s.start_time?.trim() || !REGEX_PATTERNS.time.test(s.start_time))
        return `Informe o horário de início da aula ${i + 1} (HH:mm).`;
      if (!s.end_time?.trim() || !REGEX_PATTERNS.time.test(s.end_time))
        return `Informe o horário de término da aula ${i + 1} (HH:mm).`;
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      if (eh < sh || (eh === sh && em <= sm))
        return `Horário de término deve ser posterior ao início na aula ${i + 1}.`;
    }
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (enableTeacherSelection && !selectedTeacherId) {
      setTeacherError("Selecione um professor");
      return;
    }
    setTeacherError(null);

    const rawTeacherId = teacherId || (enableTeacherSelection ? selectedTeacherId : null);
    const effectiveTeacherId = rawTeacherId && String(rawTeacherId).trim() ? rawTeacherId : null;
    const payDay = selectedStudent?.pay_day ?? null;
    const hourlyRate = selectedStudent?.hourly_rate ?? null;
    const studentName = selectedStudent?.name ?? "Aluno";

    const items: CreateClassLogPackageItem[] = slots.map((s) => {
      const classDateIso = brDateToIso(s.class_date);
      const startAt = buildTimestamptz(classDateIso, s.start_time);
      const endAt = buildTimestamptz(classDateIso, s.end_time);
      const durationMinutes = Math.round(
        (new Date(endAt).getTime() - new Date(startAt).getTime()) / (60 * 1000)
      );
      const slotAmount =
        hourlyRate != null && hourlyRate > 0 && durationMinutes > 0
          ? hourlyRate * (durationMinutes / 60)
          : 0;

      const classLog: ClassLogInsert = {
        student_id: studentId,
        class_date: classDateIso,
        teacher_id: effectiveTeacherId,
        start_at: startAt,
        end_at: endAt,
        duration_minutes: durationMinutes,
        billed_amount: slotAmount > 0 ? slotAmount : null,
        title: null,
        observations: null,
      };
      return { classLog };
    });

    let packageFinancial: CreateClassLogPackagePayload["packageFinancial"] = null;
    if (!semCobranca && hourlyRate != null && hourlyRate > 0) {
      const totalAmount = items.reduce((sum, it) => sum + (it.classLog.billed_amount ?? 0), 0);
      if (totalAmount > 0) {
        const firstDate = slots[0]?.class_date;
        const dueBr = firstDate ? getDefaultDueDateForClassMonth(firstDate, payDay ?? null) : "";
        const [, m, y] = firstDate?.split("/") ?? [];
        const monthYear = m && y ? `${getMonthName(Number(m))} ${y}` : "";
        if (!paymentMethod?.trim()) {
          toast.error(classesContent.packageDialog.toasts.selectPaymentMethod);
          return;
        }
        packageFinancial = {
          amount: totalAmount,
          due_date: dueBr ? brDateToIso(dueBr) : new Date().toISOString().slice(0, 10),
          description: `Pacote mensal - ${studentName} - ${slots.length} aula(s) - ${monthYear}`,
          payment_method: paymentMethod.trim(),
        };
      }
    }

    createPackage.mutate(
      { items, packageFinancial },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={classesContent.packageDialog.title}
      size="MD"
      scrollable={true}
    >
      <div className="space-y-4">
        {/* Professor */}
        {enableTeacherSelection && (
          <div className="space-y-2">
            <Label>{classesContent.packageDialog.teacherLabel}</Label>
            <Select
              value={selectedTeacherId}
              onValueChange={(v) => {
                setSelectedTeacherId(v);
                setTeacherError(null);
              }}
              disabled={loadingTeachers}
            >
              <SelectTrigger>
                <SelectValue placeholder={classesContent.packageDialog.teacherPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t: Teacher) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teacherError && <p className="text-sm text-destructive">{teacherError}</p>}
          </div>
        )}

        {/* Aluno */}
        <div className="space-y-2">
          <Label>{classesContent.packageDialog.studentLabel}</Label>
          <Select value={studentId} onValueChange={setStudentId} disabled={loadingStudents}>
            <SelectTrigger>
              <SelectValue placeholder={classesContent.packageDialog.studentPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {activeStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sem cobrança */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="pkg-semCobranca"
            checked={semCobranca}
            onCheckedChange={(c) => setSemCobranca(!!c)}
          />
          <Label htmlFor="pkg-semCobranca" className="cursor-pointer font-normal">
            {classesContent.packageDialog.noCharge}
          </Label>
        </div>

        {/* Slots */}
        <PackageSlotList
          slots={slots}
          scheduleMode={scheduleMode}
          fixedMonth={fixedMonth}
          fixedYear={fixedYear}
          fixedWeekdays={fixedWeekdays}
          fixedStartTime={fixedStartTime}
          fixedEndTime={fixedEndTime}
          onSlotsChange={setSlots}
          onScheduleModeChange={setScheduleMode}
          onFixedMonthChange={setFixedMonth}
          onFixedYearChange={setFixedYear}
          onFixedWeekdaysChange={setFixedWeekdays}
          onFixedStartTimeChange={setFixedStartTime}
          onFixedEndTimeChange={setFixedEndTime}
        />

        {/* Financeiro */}
        {!semCobranca && selectedStudent && (
          <PackageFinancialSection
            slots={slots}
            hourlyRate={selectedStudent.hourly_rate ?? null}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
          />
        )}

        {/* Ações */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPackage.isPending}
          >
            {classesContent.packageDialog.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={createPackage.isPending}>
            {createPackage.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {classesContent.packageDialog.submitting}
              </>
            ) : (
              classesContent.packageDialog.submitButton(slots.length)
            )}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
