import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Teacher, TeacherInsert } from "@/hooks/useTeachers";

const teacherSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255),
  phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal("").transform(() => undefined)),
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
      phone: teacher?.phone || "",
    },
  });

  useEffect(() => {
    reset({
      name: teacher?.name || "",
      email: teacher?.email || "",
      phone: teacher?.phone || "",
    });
  }, [teacher, reset]);

  const handleFormSubmit = (data: TeacherFormData) => {
    // Normaliza campos opcionais vazios para undefined
    const payload: TeacherInsert = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
    } as TeacherInsert;

    onSubmit(payload);
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const digits = value.replace(/\D/g, "").slice(0, 11);

    let masked = digits;
    if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 6) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;

    setValue("phone", masked, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {teacher ? "Editar Professor" : "Cadastrar Novo Professor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                placeholder="Nome do professor"
                autoFocus
                disabled={isLoading}
                {...register("name")}
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
                placeholder="email@exemplo.com"
                disabled={isLoading}
                {...register("email")}
              />
              {typeof errors.email?.message === "string" && (
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
                placeholder="(00) 00000-0000"
                disabled={isLoading}
                {...register("phone")}
                onChange={handlePhoneChange}
              />
              {typeof errors.phone?.message === "string" && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : teacher ? (
                "Salvar alterações"
              ) : (
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
