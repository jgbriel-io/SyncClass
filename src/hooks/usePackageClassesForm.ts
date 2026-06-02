import { toast } from "sonner";
import { REGEX_PATTERNS, isValidDateString } from "@/lib/utils/patterns";
import {
  brDateToIso,
  buildTimestamptzFromDateAndTime as buildTimestamptz,
  getDefaultDueDateForPackage,
} from "@/lib/utils/classFormHelpers";
import {
  useCreateClassLogPackage,
  CreateClassLogPackageItem,
  CreateClassLogPackagePayload,
  ClassLogInsert,
} from "./useClassLogs";
import { classes as classesContent, common } from "@/content";
import type { Slot } from "@/components/classes/PackageSlotList";
import type { Student } from "./useStudents";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

function getDefaultDueDateForClassMonth(
  classDateBr: string,
  payDay: number | null
): string {
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

interface UsePackageClassesFormOptions {
  slots: Slot[];
  studentId: string | null;
  selectedTeacherId: string | null;
  selectedStudent: Student | null;
  semCobranca: boolean;
  enableTeacherSelection: boolean;
  teacherId?: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export const usePackageClassesForm = ({
  slots,
  studentId,
  selectedTeacherId,
  selectedStudent,
  semCobranca,
  enableTeacherSelection,
  teacherId,
  onSuccess,
  onClose,
}: UsePackageClassesFormOptions) => {
  const createPackage = useCreateClassLogPackage();

  const validate = (): string | null => {
    if (enableTeacherSelection && !selectedTeacherId)
      return common.errors.selectTeacher;
    if (!studentId) return common.errors.selectStudent;
    if (slots.length === 0)
      return "Adicione ao menos uma aula ou use Horário fixo para gerar as aulas do mês.";
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.class_date?.trim()) return `Informe a data da aula ${i + 1}.`;
      if (!REGEX_PATTERNS.date.test(s.class_date))
        return `Data inválida na aula ${i + 1}.`;
      if (!isValidDateString(s.class_date))
        return `Data inválida na aula ${i + 1}.`;
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

  const submit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const rawTeacherId =
      teacherId || (enableTeacherSelection ? selectedTeacherId : null);
    const effectiveTeacherId =
      rawTeacherId && String(rawTeacherId).trim() ? rawTeacherId : null;
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
        student_id: studentId!,
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

    let packageFinancial: CreateClassLogPackagePayload["packageFinancial"] =
      null;
    if (!semCobranca && hourlyRate != null && hourlyRate > 0) {
      const totalAmount = items.reduce(
        (sum, it) => sum + (it.classLog.billed_amount ?? 0),
        0
      );
      if (totalAmount > 0) {
        const firstDate = slots[0]?.class_date;
        const dueBr = firstDate
          ? getDefaultDueDateForClassMonth(firstDate, payDay ?? null)
          : "";
        const [, m, y] = firstDate?.split("/") ?? [];
        const monthYear = m && y ? `${getMonthName(Number(m))} ${y}` : "";
        packageFinancial = {
          amount: totalAmount,
          due_date: dueBr
            ? brDateToIso(dueBr)
            : new Date().toISOString().slice(0, 10),
          description: `Pacote mensal - ${studentName} - ${slots.length} aula(s) - ${monthYear}`,
          payment_method: null,
        };
      }
    }

    createPackage.mutate(
      { items, packageFinancial },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
      }
    );
  };

  return { submit, validate, isPending: createPackage.isPending };
};
