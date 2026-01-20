import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { UserWithProfile } from "@/hooks/useUsers";

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["admin", "student"]),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithProfile | null;
  onSubmit: (data: {
    email: string;
    password?: string;
    fullName: string;
    role: "admin" | "student";
  }) => void;
  isLoading: boolean;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading,
}: UserFormDialogProps) {
  const [selectedRole, setSelectedRole] = useState<"admin" | "student">("student");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || "",
      password: "",
      fullName: user?.profile?.full_name || "",
      role: user?.role?.role || "student",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        password: "",
        fullName: user.profile?.full_name || "",
        role: user.role?.role || "student",
      });
      setSelectedRole(user.role?.role || "student");
    } else {
      reset({
        email: "",
        password: "",
        fullName: "",
        role: "student",
      });
      setSelectedRole("student");
    }
  }, [user, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    onSubmit({
      email: data.email,
      password: data.password || undefined,
      fullName: data.fullName,
      role: selectedRole,
    });
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value as "admin" | "student");
    setValue("role", value as "admin" | "student");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              {...register("email")}
              disabled={isLoading || !!user}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Senha {user ? "(deixe em branco para manter)" : "*"}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={user ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              placeholder="Nome do usuário"
              {...register("fullName")}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Privilégio *</Label>
            <Select
              value={selectedRole}
              onValueChange={handleRoleChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o privilégio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="student">Aluno</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register("role")} />
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
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
              ) : user ? (
                "Salvar Alterações"
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
