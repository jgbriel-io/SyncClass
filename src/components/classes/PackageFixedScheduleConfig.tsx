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
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { classes as classesContent, common } from "@/content";

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

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

interface PackageFixedScheduleConfigProps {
  fixedMonth: number;
  fixedYear: number;
  fixedWeekdays: number[];
  fixedStartTime: string;
  fixedEndTime: string;
  onFixedMonthChange: (month: number) => void;
  onFixedYearChange: (year: number) => void;
  onFixedWeekdaysChange: (weekdays: number[]) => void;
  onFixedStartTimeChange: (time: string) => void;
  onFixedEndTimeChange: (time: string) => void;
  onGenerate: () => void;
}

export function PackageFixedScheduleConfig({
  fixedMonth,
  fixedYear,
  fixedWeekdays,
  fixedStartTime,
  fixedEndTime,
  onFixedMonthChange,
  onFixedYearChange,
  onFixedWeekdaysChange,
  onFixedStartTimeChange,
  onFixedEndTimeChange,
  onGenerate,
}: PackageFixedScheduleConfigProps) {
  const toggleWeekday = (day: number) => {
    const next = fixedWeekdays.includes(day)
      ? fixedWeekdays.filter((d) => d !== day)
      : [...fixedWeekdays, day].sort((a, b) => a - b);
    onFixedWeekdaysChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        {classesContent.packageDialog.description}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            {classesContent.packageDialog.filters?.monthLabel ||
              classesContent.filters.monthLabel}
          </Label>
          <Select
            value={fixedMonth ? String(fixedMonth) : ""}
            onValueChange={(v) => onFixedMonthChange(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={common.placeholders.select} />
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
          <Label>
            {classesContent.packageDialog.filters?.yearLabel ||
              classesContent.filters.yearLabel}
          </Label>
          <Select
            value={fixedYear ? String(fixedYear) : ""}
            onValueChange={(v) => onFixedYearChange(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={common.placeholders.select} />
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
        <Label>
          {classesContent.packageDialog.filters?.weekdaysLabel ||
            classesContent.filters.weekdaysLabel}
        </Label>
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
          <Label>{classesContent.logFormDialog.startTimeLabel}</Label>
          <Input
            type="time"
            value={fixedStartTime}
            onChange={(e) => onFixedStartTimeChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{classesContent.logFormDialog.endTimeLabel}</Label>
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
          onClick={onGenerate}
          className="w-full sm:w-auto min-w-[200px] h-10 font-medium"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          {classesContent.packageDialog.generateButton}
        </Button>
        <p className="text-xs text-muted-foreground mt-1.5">
          {classesContent.packageDialog.description}
        </p>
      </div>
    </div>
  );
}
