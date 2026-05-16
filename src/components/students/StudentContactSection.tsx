import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors, FieldValues } from "react-hook-form";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STACK, GAP, ICON_SIZES } from "@/lib/design-tokens";
import { maskPhone, brDateStringToDate } from "@/lib/utils/patterns";
import { useDateMask } from "@/hooks/useDateMask";
import { students as studentsContent, common } from "@/content";

interface StudentContactSectionProps {
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  errors: FieldErrors<FieldValues>;
  isLoading?: boolean;
  isBrazilSelected: boolean;
}

export function StudentContactSection({
  register,
  setValue,
  watch,
  errors,
  isLoading,
  isBrazilSelected,
}: StudentContactSectionProps) {
  const birthDate = watch("birth_date");
  const { handleChange: handleDateChange, handleKeyDown: handleDateKeyDown } = useDateMask(
    (value, options) => setValue("birth_date", value, options)
  );

  return (
    <>
      {/* Data de Nascimento */}
      <div className={STACK.TIGHT}>
        <Label htmlFor="birth_date">{studentsContent.contactSection.birthDateLabel}</Label>
        <div className={`flex ${GAP.TIGHT}`}>
          <Input
            id="birth_date"
            type="text"
            placeholder={common.placeholders.date}
            maxLength={10}
            value={birthDate || ""}
            onChange={handleDateChange}
            onKeyDown={handleDateKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={isLoading}
              >
                <CalendarIcon className={ICON_SIZES.SM} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b flex items-center justify-center gap-2">
                <Select
                  value={
                    birthDate
                      ? brDateStringToDate(birthDate)?.getFullYear().toString()
                      : "2000"
                  }
                  onValueChange={(year) => {
                    const currentDate = birthDate
                      ? brDateStringToDate(birthDate)
                      : new Date(2000, 0, 1);
                    const newDate = new Date(parseInt(year), currentDate?.getMonth() ?? 0, 1);
                    setValue("birth_date", format(newDate, "dd/MM/yyyy", { locale: ptBR }), {
                      shouldValidate: true,
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={common.placeholders.year} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from(
                      { length: new Date().getFullYear() - 1920 + 1 },
                      (_, i) => new Date().getFullYear() - i
                    ).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Calendar
                mode="single"
                selected={brDateStringToDate(birthDate || "") ?? undefined}
                onSelect={(date) => {
                  if (date) {
                    setValue("birth_date", format(date, "dd/MM/yyyy", { locale: ptBR }), {
                      shouldValidate: true,
                    });
                  }
                }}
                locale={ptBR}
                month={
                  birthDate
                    ? brDateStringToDate(birthDate) ?? new Date(2000, 0, 1)
                    : new Date(2000, 0, 1)
                }
                onMonthChange={() => {}}
                fromYear={1920}
                toYear={new Date().getFullYear()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {errors.birth_date && (
          <p className="text-sm text-destructive">{String(errors.birth_date.message)}</p>
        )}
      </div>

      {/* Telefone */}
      <div className={STACK.TIGHT}>
        <Label htmlFor="phone">{studentsContent.contactSection.phoneLabel}</Label>
        <Input
          id="phone"
          type="text"
          inputMode={isBrazilSelected ? "numeric" : "text"}
          placeholder={isBrazilSelected ? "(00) 00000-0000" : studentsContent.contactSection.phoneInternational}
          {...register("phone")}
          onChange={(e) => {
            if (isBrazilSelected) {
              setValue("phone", maskPhone(e.target.value), { shouldValidate: true });
            } else {
              setValue("phone", e.target.value, { shouldValidate: true });
            }
          }}
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{String(errors.phone.message)}</p>
        )}
      </div>

      {/* Email */}
      <div className={STACK.TIGHT}>
        <Label htmlFor="email">{studentsContent.contactSection.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          placeholder={common.placeholders.email}
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{String(errors.email.message)}</p>
        )}
      </div>
    </>
  );
}
