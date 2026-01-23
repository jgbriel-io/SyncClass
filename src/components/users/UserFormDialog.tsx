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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { UserWithProfile } from "@/hooks/useUsers";

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.enum(["admin", "student", "teacher"]),
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
    role: "admin" | "student" | "teacher";
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
  const isEdit = !!user;
  const [selectedRole, setSelectedRole] = useState<"admin" | "student" | "teacher">(
    (user?.role?.role as any) || "admin",
  );

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
      role: user?.role?.role || "admin",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        password: "",
        fullName: user.profile?.full_name || "",
        role: user.role?.role || "admin",
      });
      setSelectedRole((user.role?.role as any) || "admin");
    } else {
      reset({
        email: "",
        password: "",
        fullName: "",
        role: "admin",
      });
      setSelectedRole("admin");
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
    setSelectedRole(value as "admin" | "student" | "teacher");
    setValue("role", value as "admin" | "student" | "teacher");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 mb-4">
          <Label className="mb-2 block text-sm font-medium">Tipo de conta</Label>
          <Tabs
            value={selectedRole}
            onValueChange={handleRoleChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="student">Aluno</TabsTrigger>
              <TabsTrigger value="teacher">Professor</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <input type="hidden" {...register("role")} />
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

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Senha (deixe em branco para manter)
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Deixe em branco para manter"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">
              {selectedRole === "admin"
                ? "Nome completo do administrador *"
                : selectedRole === "student"
                ? "Nome completo do aluno *"
                : "Nome completo do professor *"}
            </Label>
            <Input
              id="fullName"
              placeholder={
                selectedRole === "admin"
                  ? "Nome do administrador"
                  : selectedRole === "student"
                  ? "Nome do aluno"
                  : "Nome do professor"
              }
              {...register("fullName")}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            {selectedRole === "student" && !isEdit && (
              <p className="text-xs text-muted-foreground">
                Esta opção cria a conta de acesso do aluno. Os dados detalhados
                do cadastro (CPF, cidade, valor/hora, etc.) continuam sendo
                gerenciados na aba Alunos.
              </p>
            )}
            {selectedRole === "teacher" && !isEdit && (
              <p className="text-xs text-muted-foreground">
                Esta opção cria a conta de acesso do professor. Dados
                complementares continuam sendo gerenciados na aba Professores.
              </p>
            )}
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
