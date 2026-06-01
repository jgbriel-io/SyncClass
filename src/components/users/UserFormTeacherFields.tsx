import {
  type UseFormRegister,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TeacherFormData } from "./userFormSchemas";
import { teachers as teachersContent } from "@/content";

interface UserFormTeacherFieldsProps {
  register: UseFormRegister<TeacherFormData>;
  errors: FieldErrors<TeacherFormData>;
  setValue: UseFormSetValue<TeacherFormData>;
  isLoading: boolean;
  isEdit: boolean;
}

export function UserFormTeacherFields({
  register,
  errors,
  setValue,
  isLoading,
  isEdit,
}: UserFormTeacherFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="name">Nome completo *</Label>
        <Input
          id="name"
          placeholder={teachersContent.formDialog.namePlaceholder}
          {...register("name")}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder={teachersContent.formDialog.emailPlaceholder}
          {...register("email")}
          disabled={isLoading || isEdit}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          type="text"
          inputMode="numeric"
          maxLength={15}
          placeholder={teachersContent.formDialog.phonePlaceholder}
          {...register("phone")}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
            let masked = digits;
            if (digits.length > 2)
              masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
            if (digits.length > 6)
              masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
            setValue("phone", masked, { shouldValidate: true });
          }}
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>
    </div>
  );
}
