import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";
import { type ActivityFormData } from "./SendActivityDialog.schema";
import { activities as activitiesContent } from "@/content";

interface Props {
  register: UseFormRegister<ActivityFormData>;
  setValue: UseFormSetValue<ActivityFormData>;
  errors: FieldErrors<ActivityFormData>;
  isPending: boolean;
  dueDate: string;
}

export function ActivityDueDateSection({
  register,
  setValue,
  errors,
  isPending,
  dueDate,
}: Props) {
  return (
    <div className="space-y-2">
      <Label>{activitiesContent.sendDialog.dueDateLabel}</Label>
      <p className="text-xs text-muted-foreground">
        {activitiesContent.sendDialog.dueDateHint}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="due_date"
              variant="outline"
              className="w-full sm:flex-1 justify-start text-left font-normal"
              disabled={isPending}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate || activitiesContent.sendDialog.dueDatePlaceholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                dueDate && REGEX_PATTERNS.date.test(dueDate)
                  ? (() => {
                      const [d, m, y] = dueDate.split("/");
                      return new Date(
                        parseInt(y, 10),
                        parseInt(m, 10) - 1,
                        parseInt(d, 10)
                      );
                    })()
                  : undefined
              }
              onSelect={(date) => {
                if (date)
                  setValue(
                    "due_date",
                    format(date, "dd/MM/yyyy", { locale: ptBR }),
                    { shouldValidate: true }
                  );
              }}
              locale={ptBR}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
            />
          </PopoverContent>
        </Popover>
        <Input
          id="due_time"
          type="time"
          {...register("due_time")}
          disabled={isPending}
          className="w-full sm:w-[120px]"
        />
      </div>
      {errors.due_date && (
        <p className="text-sm text-destructive">{errors.due_date.message}</p>
      )}
      {errors.due_time && (
        <p className="text-sm text-destructive">{errors.due_time.message}</p>
      )}
    </div>
  );
}
