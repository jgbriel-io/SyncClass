import { type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminFormData } from "./userFormSchemas";
import { users as usersContent } from "@/content";

interface UserFormAdminFieldsProps {
  register: UseFormRegister<AdminFormData>;
  errors: FieldErrors<AdminFormData>;
  isLoading: boolean;
  isEdit: boolean;
}

export function UserFormAdminFields({
  register,
  errors,
  isLoading,
  isEdit,
}: UserFormAdminFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder={usersContent.formDialog.emailPlaceholder}
          {...register("email")}
          disabled={isLoading || isEdit}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="fullName">Nome completo *</Label>
        <Input
          id="fullName"
          placeholder={usersContent.formDialog.namePlaceholder}
          {...register("fullName")}
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>
    </div>
  );
}
