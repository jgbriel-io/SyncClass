import { useState, useEffect } from "react";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Plus, Trash2, CalendarIcon, CalendarDays, List } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import {
  useCreateClassLogPackage,
  CreateClassLogPackageItem,
  CreateClassLogPackagePayload,
  ClassLogInsert,
} from "@/hooks/useClassLogs";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/formatters";
import { brDateStringToDate, isValidDateString } from "@/lib/utils/patterns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

function getDefaultDueDateForClassMonth(
  classDateBr: string,
  payDay: number | null
): string {
  if (!classDateBr || !REGEX_PATTERNS.date.test(classDateBr)) {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const day = Math.min(payDay && payDay >= 1 && payDay <= 31 ? payDay : today.getDate(), lastDay);
    const dd = String(day).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${today.getFullYear()}`;
  }
  if (payDay == null || payDay < 1 || payDay > 31) return classDateBr;
  const iso = brDateToIso(classDateBr);
  const [year, month] = iso.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(payDay, lastDay);
  const dd = day.toString().padStart(2, "0");
  const mm = month.toString().padStart(2, "0");
  return `${dd}/${mm}/${year}`;
}

function buildTimestamptzFromDateAndTime(classDateIso: string, time: string): string {
  const [y, m, d] = classDateIso.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0).toISOString();
}

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

type Slot = { class_date: string; start_time: string; end_time: string };

const emptySlot: Slot = { class_date: "", start_time: "", end_time: "" };

type ScheduleMode = "fixed" | "dynamic";

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

/** Retorna true se a data (dd/mm/yyyy) é hoje ou futura */
function isDateTodayOrFuture(brDate: string): boolean {
  if (!brDate || !REGEX_PATTERNS.date.test(brDate)) return false;
  const [day, month, year] = brDate.split("/").map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= today;
}

/** Gera slots do mês para os dias da semana e horário informados. Inclui apenas datas de hoje em diante. getDay(): 0=Dom, 1=Seg, ... 6=Sáb */
function generateSlotsForMonth(
  year: number,
  month: number,
  weekdays: number[],
  startTime: string,
  endTime: string
): Slot[] {
  if (weekdays.length === 0 || !REGEX_PATTERNS.time.test(startTime) || !REGEX_PATTERNS.time.test(endTime)) return [];
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const slots: Slot[] = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    if (weekdays.includes(d.getDay())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(month).padStart(2, "0");
      const classDateBr = `${dd}/${mm}/${year}`;
      if (isDateTodayOrFuture(classDateBr)) {
        slots.push({
          class_date: classDateBr,
          start_time: startTime,
          end_time: endTime,
        });
      }
    }
  }
  return slots;
}

interface PackageClassesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId?: string;
  enableTeacherSelection?: boolean;
  /** Aluno já selecionado (ex.: vindo do perfil do aluno) */
  initialStudentId?: string | null;
  onSuccess?: () => void;
}

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

  // Ao fechar o modal, limpa todo o formulário para o próximo uso
  useEffect(() => {
    if (!open) {
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
    }
  }, [open, teacherId]);

  // Ao abrir, aplica aluno/professor iniciais e garante que o formulário esteja limpo
  useEffect(() => {
    if (open) {
      setStudentId(initialStudentId ?? "");
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
    }
  }, [open, initialStudentId, teacherId]);

  const addSlot = () => setSlots((prev) => [...prev, { ...emptySlot }]);
  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };
  const updateSlot = (index: number, field: keyof Slot, value: string) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const toggleFixedWeekday = (day: number) => {
    setFixedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleGenerateFixedSlots = () => {
    if (!fixedMonth || !fixedYear) {
      toast.error("Selecione o mês e o ano.");
      return;
    }
    if (fixedWeekdays.length === 0) {
      toast.error("Selecione pelo menos um dia da semana.");
      return;
    }
    if (!REGEX_PATTERNS.time.test(fixedStartTime) || !REGEX_PATTERNS.time.test(fixedEndTime)) {
      toast.error("Informe o horário de início e término.");
      return;
    }
    const [sh, sm] = fixedStartTime.split(":").map(Number);
    const [eh, em] = fixedEndTime.split(":").map(Number);
    if (eh < sh || (eh === sh && em <= sm)) {
      toast.error("Horário de término deve ser posterior ao início.");
      return;
    }
    const generated = generateSlotsForMonth(
      fixedYear,
      fixedMonth,
      fixedWeekdays,
      fixedStartTime,
      fixedEndTime
    );
    if (generated.length === 0) {
      toast.error("Nenhuma data encontrada para o mês e dias selecionados.");
      return;
    }
    setSlots(generated);
    toast.success(`${generated.length} aula(s) gerada(s) para ${getMonthName(fixedMonth)}/${fixedYear}.`);
  };

  const validate = (): string | null => {
    if (enableTeacherSelection && !selectedTeacherId) return "Selecione um professor.";
    if (!studentId) return "Selecione um aluno.";
    if (slots.length === 0) return "Adicione ao menos uma aula ou use Horário fixo para gerar as aulas do mês.";
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.class_date?.trim()) return `Informe a data da aula ${i + 1}.`;
      if (!REGEX_PATTERNS.date.test(s.class_date)) return `Data inválida na aula ${i + 1}.`;
      if (!isValidDateString(s.class_date)) return `Data inválida na aula ${i + 1}.`;
      if (!isDateTodayOrFuture(s.class_date)) return `A data da aula ${i + 1} deve ser de hoje em diante. Não é possível cadastrar aulas em datas passadas.`;
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
      const startAt = buildTimestamptzFromDateAndTime(classDateIso, s.start_time);
      const endAt = buildTimestamptzFromDateAndTime(classDateIso, s.end_time);
      const startMs = new Date(startAt).getTime();
      const endMs = new Date(endAt).getTime();
      const durationMinutes = Math.round((endMs - startMs) / (60 * 1000));
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
        const [d, m, y] = firstDate?.split("/") ?? [];
        const monthYear = m && y ? `${getMonthName(Number(m))} ${y}` : "";
        if (!paymentMethod?.trim()) {
        toast.error("Selecione o método de pagamento.");
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
    });
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cadastrar pacote de aulas"
      size="MD"
      scrollable={true}
    >
        <div className="space-y-4">
          {enableTeacherSelection && (
            <div className="space-y-2">
              <Label>Professor *</Label>
              <Select
                value={selectedTeacherId}
                onValueChange={(v) => {
                  setSelectedTeacherId(v);
                  setTeacherError(null);
                }}
                disabled={loadingTeachers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t: Teacher) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teacherError && (
                <p className="text-sm text-destructive">{teacherError}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Aluno *</Label>
            <Select
              value={studentId}
              onValueChange={setStudentId}
              disabled={loadingStudents}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="pkg-semCobranca"
              checked={semCobranca}
              onCheckedChange={(c) => setSemCobranca(!!c)}
            />
            <Label htmlFor="pkg-semCobranca" className="cursor-pointer font-normal">
              Sem cobrança
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Como preencher as aulas</Label>
            <div className="flex rounded-lg border p-1 bg-muted/30">
              <button
                type="button"
                onClick={() => setScheduleMode("fixed")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                  scheduleMode === "fixed"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="h-4 w-4" />
                Horário fixo
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("dynamic")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                  scheduleMode === "dynamic"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
                Dinâmico (manual)
              </button>
            </div>
          </div>

          {scheduleMode === "fixed" && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Gerar aulas em horário fixo no mês</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Mês</Label>
                  <Select
                    value={fixedMonth ? String(fixedMonth) : ""}
                    onValueChange={(v) => setFixedMonth(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((name, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ano</Label>
                  <Select
                    value={fixedYear ? String(fixedYear) : ""}
                    onValueChange={(v) => setFixedYear(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2026, 2027, 2028].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                        fixedWeekdays.includes(value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={fixedWeekdays.includes(value)}
                        onChange={() => toggleFixedWeekday(value)}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Horário início</Label>
                  <Input
                    type="time"
                    value={fixedStartTime}
                    onChange={(e) => setFixedStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Horário término</Label>
                  <Input
                    type="time"
                    value={fixedEndTime}
                    onChange={(e) => setFixedEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button type="button" onClick={handleGenerateFixedSlots} className="w-full sm:w-auto min-w-[200px] h-10 font-medium">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Gerar aulas do mês
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5">Gera as datas do mês com os dias e horários escolhidos acima.</p>
              </div>
            </div>
          )}

          {((scheduleMode === "fixed" && slots.some((s) => s.class_date)) || scheduleMode === "dynamic") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {scheduleMode === "fixed" ? `Aulas geradas (${slots.length})` : `Aulas do pacote (${slots.length})`}
                </Label>
                {scheduleMode === "dynamic" && (
                  <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                )}
              </div>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {slots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-end gap-2 rounded-lg"
                  >
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <Label className="text-xs">Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-9 text-sm",
                              !slot.class_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {slot.class_date || "dd/mm/aaaa"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={brDateStringToDate(slot.class_date) ?? undefined}
                            onSelect={(date) => {
                              if (date)
                                updateSlot(
                                  index,
                                  "class_date",
                                  format(date, "dd/MM/yyyy", { locale: ptBR })
                                );
                            }}
                            locale={ptBR}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const d = new Date(date);
                              d.setHours(0, 0, 0, 0);
                              return d < today;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="w-[90px] space-y-1">
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(index, "start_time", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="w-[90px] space-y-1">
                      <Label className="text-xs">Término</Label>
                      <Input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateSlot(index, "end_time", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeSlot(index)}
                      disabled={slots.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!semCobranca && selectedStudent && (() => {
            const hourlyRate = selectedStudent.hourly_rate ?? 0;
            const total = slots.reduce((sum, s) => {
              if (!s.class_date || !s.start_time || !s.end_time || !REGEX_PATTERNS.time.test(s.start_time) || !REGEX_PATTERNS.time.test(s.end_time)) return sum;
              const classDateIso = brDateToIso(s.class_date);
              const startAt = buildTimestamptzFromDateAndTime(classDateIso, s.start_time);
              const endAt = buildTimestamptzFromDateAndTime(classDateIso, s.end_time);
              const min = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / (60 * 1000));
              return sum + (hourlyRate > 0 && min > 0 ? hourlyRate * (min / 60) : 0);
            }, 0);
            const validSlots = slots.filter((s) => s.class_date && REGEX_PATTERNS.time.test(s.start_time || "") && REGEX_PATTERNS.time.test(s.end_time || ""));
            return (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Valor total do pacote: {total > 0 ? formatCurrency(total) : "—"} ({validSlots.length} aula(s))
                </p>
                {hourlyRate <= 0 && (
                  <p className="text-xs text-amber-600">Aluno sem valor/hora cadastrado. Cadastre no perfil do aluno.</p>
                )}
                <div className="space-y-1.5">
                  <Label>Método de pagamento *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
            );
          })()}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createPackage.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createPackage.isPending}>
              {createPackage.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                `Cadastrar ${slots.length} aula(s)`
              )}
            </Button>
          </div>
        </div>
    </BaseDialog>
  );
}
