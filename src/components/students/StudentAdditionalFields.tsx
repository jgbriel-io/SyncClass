import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type StudentFormData,
  type StudentOrigin,
} from "./StudentFormDialog.schema";
import { students as studentsContent, common } from "@/content";
import { STACK } from "@/lib/design-tokens/spacing";

interface Props {
  register: UseFormRegister<StudentFormData>;
  setValue: UseFormSetValue<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
  isLoading?: boolean;
  selectedOrigin: StudentOrigin | "";
  onOriginChange: (origin: StudentOrigin) => void;
}

export function StudentAdditionalFields({
  register,
  setValue,
  errors,
  isLoading,
  selectedOrigin,
  onOriginChange,
}: Props) {
  return (
    <>
      {/* Valor por hora */}
      <div className={STACK.TIGHT}>
        <Label htmlFor="hourly_rate_valor">
          {studentsContent.formDialog.hourlyRateLabel}
        </Label>
        <Input
          id="hourly_rate_valor"
          type="text"
          placeholder={studentsContent.formDialog.hourlyRatePlaceholder}
          {...register("hourly_rate")}
          disabled={isLoading}
        />
      </div>

      {/* Dia de pagamento */}
      <div className={STACK.TIGHT}>
        <Label htmlFor="pay_day">
          {studentsContent.formDialog.payDayLabel}
        </Label>
        <Input
          id="pay_day"
          type="number"
          min={1}
          max={31}
          placeholder={common.placeholders.payDay}
          {...register("pay_day")}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            setValue(
              "pay_day",
              isNaN(v) ? "" : String(Math.min(31, Math.max(1, v))),
              { shouldValidate: true }
            );
          }}
          disabled={isLoading}
        />
      </div>

      {/* Origem */}
      <div className={STACK.TIGHT}>
        <Label>{studentsContent.formDialog.originLabel}</Label>
        <Select
          value={selectedOrigin}
          onValueChange={(value) => onOriginChange(value as StudentOrigin)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={common.placeholders.select} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="indicacao">
              {studentsContent.originOptions.indicacao}
            </SelectItem>
            <SelectItem value="google">
              {studentsContent.originOptions.google}
            </SelectItem>
            <SelectItem value="instagram">
              {studentsContent.originOptions.instagram}
            </SelectItem>
            <SelectItem value="passante">
              {studentsContent.originOptions.passante}
            </SelectItem>
            <SelectItem value="outro">
              {studentsContent.originOptions.outro}
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.origin && (
          <p className="text-sm text-destructive">{errors.origin.message}</p>
        )}
      </div>
    </>
  );
}
