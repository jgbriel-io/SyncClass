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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, CalendarDays, List, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { brDateStringToDate, REGEX_PATTERNS } from "@/lib/utils/patterns";
import { toast } from "sonner";
import { classes as classesContent } from "@/content";

export type Slot = { class_date: string; start_time: string; end_time: string };
export type ScheduleMode = "fixed" | "dynamic";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

function isDateTodayOrFuture(brDate: string): boolean {
  if (!brDate || !REGEX_PATTERNS.date.test(brDate)) return false;
  const [day, month, year] = brDate.split("/").map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= today;
}

function generateSlotsForMonth(
  year: number,
  month: number,
  weekdays: number[],
  startTime: string,
  endTime: string
): Slot[] {
  if (
    weekdays.length === 0 ||
    !REGEX_PATTERNS.time.test(startTime) ||
    !REGEX_PATTERNS.time.test(endTime)
  )
    return [];
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const slots: Slot[] = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    if (weekdays.includes(d.getDay())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(month).padStart(2, "0");
      const classDateBr = `${dd}/${mm}/${year}`;
      if (isDateTodayOrFuture(classDateBr)) {
        slots.push({ class_date: classDateBr, start_time: startTime, end_time: endTime });
      }
    }
  }
  return slots;
}

interface PackageSlotListProps {
  slots: Slot[];
  scheduleMode: ScheduleMode;
  fixedMonth: number;
  fixedYear: number;
  fixedWeekdays: number[];
  fixedStartTime: string;
  fixedEndTime: string;
  onSlotsChange: (slots: Slot[]) => void;
  onScheduleModeChange: (mode: ScheduleMode) => void;
  onFixedMonthChange: (month: number) => void;
  onFixedYearChange: (year: number) => void;
  onFixedWeekdaysChange: (weekdays: number[]) => void;
  onFixedStartTimeChange: (time: string) => void;
  onFixedEndTimeChange: (time: string) => void;
}

export function PackageSlotList({
  slots,
  scheduleMode,
  fixedMonth,
  fixedYear,
  fixedWeekdays,
  fixedStartTime,
  fixedEndTime,
  onSlotsChange,
  onScheduleModeChange,
  onFixedMonthChange,
  onFixedYearChange,
  onFixedWeekdaysChange,
  onFixedStartTimeChange,
  onFixedEndTimeChange,
}: PackageSlotListProps) {
  const addSlot = () => onSlotsChange([...slots, { class_date: "", start_time: "", end_time: "" }]);

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    onSlotsChange(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof Slot, value: string) => {
    onSlotsChange(slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const toggleWeekday = (day: number) => {
    const next = fixedWeekdays.includes(day)
      ? fixedWeekdays.filter((d) => d !== day)
      : [...fixedWeekdays, day].sort((a, b) => a - b);
    onFixedWeekdaysChange(next);
  };

  const handleGenerate = () => {
    if (!fixedMonth || !fixedYear) {
      toast.error(classesContent.packageDialog.toasts.selectMonth);
      return;
    }
    if (fixedWeekdays.length === 0) {
      toast.error(classesContent.packageDialog.toasts.selectWeekday);
      return;
    }
    if (!REGEX_PATTERNS.time.test(fixedStartTime) || !REGEX_PATTERNS.time.test(fixedEndTime)) {
      toast.error(classesContent.packageDialog.toasts.invalidTime);
      return;
    }
    const [sh, sm] = fixedStartTime.split(":").map(Number);
    const [eh, em] = fixedEndTime.split(":").map(Number);
    if (eh < sh || (eh === sh && em <= sm)) {
      toast.error(classesContent.packageDialog.toasts.endTimeBeforeStart);
      return;
    }
    const generated = generateSlotsForMonth(fixedYear, fixedMonth, fixedWeekdays, fixedStartTime, fixedEndTime);
    if (generated.length === 0) {
      toast.error(classesContent.packageDialog.toasts.noDatesFound);
      return;
    }
    onSlotsChange(generated);
    toast.success(classesContent.packageDialog.toasts.generated(generated.length, MONTH_NAMES[fixedMonth - 1], fixedYear));
  };

  return (
    <>
      {/* Seletor de modo */}
      <div className="space-y-2">
        <Label>Como preencher as aulas</Label>
        <div className="flex rounded-lg border p-1 bg-muted/30">
          <button
            type="button"
            onClick={() => onScheduleModeChange("fixed")}
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
            onClick={() => onScheduleModeChange("dynamic")}
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

      {/* Configuração de horário fixo */}
      {scheduleMode === "fixed" && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Gerar aulas em horário fixo no mês</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Mês</Label>
              <Select
                value={fixedMonth ? String(fixedMonth) : ""}
                onValueChange={(v) => onFixedMonthChange(Number(v))}
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
                onValueChange={(v) => onFixedYearChange(Number(v))}
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
                    onChange={() => toggleWeekday(value)}
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
                onChange={(e) => onFixedStartTimeChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Horário término</Label>
              <Input
                type="time"
                value={fixedEndTime}
                onChange={(e) => onFixedEndTimeChange(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleGenerate}
              className="w-full sm:w-auto min-w-[200px] h-10 font-medium"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Gerar aulas do mês
            </Button>
            <p className="text-xs text-muted-foreground mt-1.5">
              Gera as datas do mês com os dias e horários escolhidos acima.
            </p>
          </div>
        </div>
      )}

      {/* Lista de slots */}
      {((scheduleMode === "fixed" && slots.some((s) => s.class_date)) ||
        scheduleMode === "dynamic") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {scheduleMode === "fixed"
                ? `Aulas geradas (${slots.length})`
                : `Aulas do pacote (${slots.length})`}
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
              <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg">
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
                            updateSlot(index, "class_date", format(date, "dd/MM/yyyy", { locale: ptBR }));
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
    </>
  );
}
