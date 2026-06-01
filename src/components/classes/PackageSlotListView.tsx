import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { brDateStringToDate } from "@/lib/utils/patterns";
import { classes as classesContent } from "@/content";
import type { Slot, ScheduleMode } from "./PackageSlotList";

interface PackageSlotListViewProps {
  slots: Slot[];
  scheduleMode: ScheduleMode;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, field: keyof Slot, value: string) => void;
}

export function PackageSlotListView({
  slots,
  scheduleMode,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
}: PackageSlotListViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {scheduleMode === "fixed"
            ? `${classesContent.packageDialog.slotListTitle} (${slots.length})`
            : `${classesContent.packageDialog.slotListTitleDynamic} (${slots.length})`}
        </Label>
        {scheduleMode === "dynamic" && (
          <Button type="button" variant="outline" size="sm" onClick={onAddSlot}>
            <Plus className="h-4 w-4 mr-1" />
            {classesContent.packageDialog.addSlotButton}
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
              <Label className="text-xs">
                {classesContent.packageDialog.slotDateLabel}
              </Label>
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
                    {slot.class_date ||
                      classesContent.logFormDialog.datePlaceholder}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={brDateStringToDate(slot.class_date) ?? undefined}
                    onSelect={(date) => {
                      if (date)
                        onUpdateSlot(
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
              <Label className="text-xs">
                {classesContent.packageDialog.slotStartLabel}
              </Label>
              <Input
                type="time"
                value={slot.start_time}
                onChange={(e) =>
                  onUpdateSlot(index, "start_time", e.target.value)
                }
                className="h-9"
              />
            </div>
            <div className="w-[90px] space-y-1">
              <Label className="text-xs">
                {classesContent.packageDialog.slotEndLabel}
              </Label>
              <Input
                type="time"
                value={slot.end_time}
                onChange={(e) =>
                  onUpdateSlot(index, "end_time", e.target.value)
                }
                className="h-9"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
              onClick={() => onRemoveSlot(index)}
              disabled={slots.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
