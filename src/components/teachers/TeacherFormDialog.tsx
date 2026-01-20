import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Teacher, TeacherInsert } from "@/hooks/useTeachers";

const teacherSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().max(20).optional().or(z.literal("").transform(() => undefined)),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{teacher ? "Editar Professor" : "Novo Professor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input {...register("name")} placeholder="Nome" autoFocus disabled={isLoading} />
            {errors.name?.message && <span className="text-destructive text-xs">{errors.name.message}</span>}
          </div>
          <div>
            <Input {...register("email")} placeholder="Email" disabled={isLoading} />
            {typeof errors.email?.message === 'string' && (
              <span className="text-destructive text-xs">{errors.email.message}</span>
            )}
          </div>
          <div>
            <Input {...register("phone")} placeholder="Telefone" disabled={isLoading} />
            {typeof errors.phone?.message === 'string' && (
              <span className="text-destructive text-xs">{errors.phone.message}</span>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {teacher ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
