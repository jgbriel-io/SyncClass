import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { Teacher, TeacherInsert } from "@/hooks/useTeachers";
import { REGEX_PATTERNS, maskPhone } from "@/lib/utils/patterns";
import { emailSchema } from "@/lib/validation/email";
import { teachers as teachersContent, common } from "@/content";

const teacherSchema = z.object({
  name: z.string().min(2, teachersContent.validation.nameMin).max(100),
  email: emailSchema,
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return (
          (val.length === 14 || val.length === 15) &&
          REGEX_PATTERNS.phone.test(val)
        );
      },
      {
        message: teachersContent.validation.phoneFormat,
      }
    ),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher | null;
  onSubmit: (data: TeacherInsert) => void;
  isLoading?: boolean;
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  teacher,
  onSubmit,
  isLoading,
}: TeacherFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: teacher?.name || "",
      email: teacher?.email || "",
      phone: teacher?.phone ? maskPhone(teacher.phone) : "",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (teacher) {
      reset({
        name: teacher.name || "",
        email: teacher.email || "",
        phone: teacher.phone ? maskPhone(teacher.phone) : "",
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
      });
    }
  }, [open, teacher, reset]);

  const handleFormSubmit = (data: TeacherFormData) => {
    // Normalizar telefone (apenas dígitos)
    const normalizedPhone = data.phone
      ? data.phone.replace(/\D/g, "")
      : undefined;

    const payload: TeacherInsert = {
      name: data.name,
      email: data.email,
      phone: normalizedPhone,
    } as TeacherInsert;

    onSubmit(payload);
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const digits = value.replace(/\D/g, "").slice(0, 11);

    let masked = digits;
    if (digits.length > 2)
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 6)
      masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;

    setValue("phone", masked, { shouldValidate: true });
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        teacher
          ? teachersContent.formDialog.titleEdit
          : teachersContent.formDialog.titleNew
      }
      size="MD"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4 mt-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="name">{teachersContent.formDialog.nameLabel}</Label>
            <Input
              id="name"
              placeholder={teachersContent.formDialog.namePlaceholder}
              autoFocus
              disabled={isLoading}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {teachersContent.formDialog.emailLabel}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={common.placeholders.email}
              disabled={isLoading}
              {...register("email")}
            />
            {typeof errors.email?.message === "string" && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {teachersContent.formDialog.phoneLabel}
            </Label>
            <Input
              id="phone"
              type="text"
              inputMode="numeric"
              maxLength={15}
              placeholder={common.placeholders.phone}
              disabled={isLoading}
              {...register("phone")}
              onChange={handlePhoneChange}
            />
            {typeof errors.phone?.message === "string" && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {common.actions.cancel}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {teachersContent.formDialog.submitting}
              </>
            ) : teacher ? (
              teachersContent.formDialog.submitButton
            ) : (
              teachersContent.formDialog.createButton
            )}
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
