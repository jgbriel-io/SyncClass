import { Button } from "@/components/ui/button";
import { CalendarDays, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";
import { toast } from "sonner";
import { PackageFixedScheduleConfig } from "./PackageFixedScheduleConfig";
import { PackageSlotListView } from "./PackageSlotListView";
import { Label } from "@/components/ui/label";
import { classes as classesContent } from "@/content";

export type Slot = { class_date: string; start_time: string; end_time: string };
export type ScheduleMode = "fixed" | "dynamic";

export const emptySlot: Slot = { class_date: "", start_time: "", end_time: "" };

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
  const addSlot = () =>
    onSlotsChange([...slots, { class_date: "", start_time: "", end_time: "" }]);

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    onSlotsChange(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof Slot, value: string) => {
    onSlotsChange(
      slots.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
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
    if (
      !REGEX_PATTERNS.time.test(fixedStartTime) ||
      !REGEX_PATTERNS.time.test(fixedEndTime)
    ) {
      toast.error(classesContent.packageDialog.toasts.invalidTime);
      return;
    }
    const [sh, sm] = fixedStartTime.split(":").map(Number);
    const [eh, em] = fixedEndTime.split(":").map(Number);
    if (eh < sh || (eh === sh && em <= sm)) {
      toast.error(classesContent.packageDialog.toasts.endTimeBeforeStart);
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
      toast.error(classesContent.packageDialog.toasts.noDatesFound);
      return;
    }
    onSlotsChange(generated);
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
    toast.success(
      classesContent.packageDialog.toasts.generated(
        generated.length,
        MONTH_NAMES[fixedMonth - 1],
        fixedYear
      )
    );
  };

  return (
    <>
      {/* Seletor de modo */}
      <div className="space-y-2">
        <Label>{classesContent.packageDialog.title}</Label>
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
            {classesContent.packageDialog.modeFixed}
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
            {classesContent.packageDialog.modeDynamic}
          </button>
        </div>
      </div>

      {/* Configuração de horário fixo */}
      {scheduleMode === "fixed" && (
        <PackageFixedScheduleConfig
          fixedMonth={fixedMonth}
          fixedYear={fixedYear}
          fixedWeekdays={fixedWeekdays}
          fixedStartTime={fixedStartTime}
          fixedEndTime={fixedEndTime}
          onFixedMonthChange={onFixedMonthChange}
          onFixedYearChange={onFixedYearChange}
          onFixedWeekdaysChange={onFixedWeekdaysChange}
          onFixedStartTimeChange={onFixedStartTimeChange}
          onFixedEndTimeChange={onFixedEndTimeChange}
          onGenerate={handleGenerate}
        />
      )}

      {/* Lista de slots */}
      {((scheduleMode === "fixed" && slots.some((s) => s.class_date)) ||
        scheduleMode === "dynamic") && (
        <PackageSlotListView
          slots={slots}
          scheduleMode={scheduleMode}
          onAddSlot={addSlot}
          onRemoveSlot={removeSlot}
          onUpdateSlot={updateSlot}
        />
      )}
    </>
  );
}
