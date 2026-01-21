import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon } from "lucide-react";
import { Student, StudentInsert } from "@/hooks/useStudents";

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
function isValidDateString(value: string) {
  if (!dateRegex.test(value)) return false;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

function maskCPF(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  // Aplica a máscara 000.000.000-00
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  } else if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  } else {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
}

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

function maskPhone(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  // Aplica a máscara (00) 00000-0000 ou (00) 0000-0000
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    // Celular: (00) 00000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
}

const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;

const studentSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  city: z.string().max(100).optional().nullable(),
  cpf: z.string()
    .min(14, "CPF inválido")
    .max(14, "CPF inválido")
    .regex(cpfRegex, "Formato deve ser 000.000.000-00"),
  phone: z.string()
    .min(14, "Telefone inválido")
    .max(15, "Telefone inválido")
    .regex(phoneRegex, "Formato deve ser (00) 00000-0000"),
  email: z.string().email("Email inválido").max(255),
  hourly_rate: z.string().optional().nullable(),
  classes_per_week: z
    .string()
    .optional()
    .nullable(),
  pay_day: z
    .string()
    .optional()
    .nullable(),
  origin: z.enum(["indicacao", "google", "instagram", "passante", "outro"]),
  status: z.enum(["ativo", "inativo"]).optional(),
  birth_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || (dateRegex.test(val) && isValidDateString(val)), {
      message: "Data inválida",
    }),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSubmit: (data: StudentInsert) => void;
  isLoading?: boolean;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSubmit,
  isLoading,
}: StudentFormDialogProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<string>(
    student?.origin || ""
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    student?.status || "ativo"
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: student?.name || "",
      city: (student as any)?.city || "",
      cpf: student?.cpf 
        ? (student.cpf.includes(".") ? student.cpf : maskCPF(student.cpf))
        : "",
      phone: student?.phone 
        ? (student.phone.includes("(") ? student.phone : maskPhone(student.phone))
        : "",
      email: student?.email || "",
      hourly_rate: (student as any)?.hourly_rate
        ? String((student as any).hourly_rate).replace(".", ",")
        : "",
      classes_per_week: (student as any)?.classes_per_week
        ? String((student as any).classes_per_week)
        : "",
      pay_day: (student as any)?.pay_day ? String((student as any).pay_day) : "",
      origin: student?.origin || undefined,
      status: student?.status || "ativo",
      birth_date: student?.birth_date
        ? format(new Date(student.birth_date + "T00:00:00"), "dd/MM/yyyy")
        : null,
    },
  });

  useEffect(() => {
    if (student) {
      // Formata CPF se vier sem formatação do banco
      const formattedCPF = student.cpf 
        ? (student.cpf.includes(".") ? student.cpf : maskCPF(student.cpf))
        : "";
      
      // Formata telefone se vier sem formatação do banco
      const formattedPhone = student.phone 
        ? (student.phone.includes("(") ? student.phone : maskPhone(student.phone))
        : "";
      
      reset({
        name: student.name,
        cpf: formattedCPF,
        phone: formattedPhone,
        email: student.email || "",
        origin: student.origin || undefined,
        status: student.status || "ativo",
        birth_date: student.birth_date
          ? format(new Date(student.birth_date + "T00:00:00"), "dd/MM/yyyy")
          : null,
      });
      setSelectedOrigin(student.origin || "");
      setSelectedStatus(student.status || "ativo");
    } else {
      reset({
        name: "",
        cpf: "",
        phone: "",
        email: "",
        origin: undefined,
        status: "ativo",
        birth_date: null,
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
    }
  }, [student, reset]);

  const handleFormSubmit = (data: StudentFormData) => {
    const hourlyRateNumber = data.hourly_rate
      ? parseFloat(data.hourly_rate.replace(/[^.\d,]/g, "").replace(",", "."))
      : null;

    const classesPerWeekNumber = data.classes_per_week
      ? Number(data.classes_per_week)
      : null;

    const payDayNumber = data.pay_day ? Number(data.pay_day) : null;

    onSubmit({
      name: data.name,
      city: data.city || null,
      cpf: data.cpf,
      phone: data.phone,
      email: data.email,
      origin: selectedOrigin as StudentInsert["origin"],
      status: selectedStatus as StudentInsert["status"],
      birth_date: data.birth_date ? brDateToIso(data.birth_date) : null,
      hourly_rate: hourlyRateNumber,
      classes_per_week: classesPerWeekNumber,
      pay_day: payDayNumber,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {student ? "Editar Aluno" : "Cadastrar Novo Aluno"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                placeholder="Nome do aluno"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Cidade do aluno"
                {...register("city")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                inputMode="numeric"
                maxLength={14}
                placeholder="000.000.000-00"
                {...register("cpf")}
                onChange={(e) => {
                  const masked = maskCPF(e.target.value);
                  setValue("cpf", masked, { shouldValidate: true });
                }}
                disabled={isLoading}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="text"
                inputMode="numeric"
                pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\d{4}$"
                maxLength={10}
                placeholder="dd/mm/aaaa"
                {...register("birth_date")}
                onChange={(e) => {
                  // basic mask: keep only digits and insert slashes
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                  let masked = digits;
                  if (digits.length > 2) masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                  if (digits.length > 4) masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                  setValue("birth_date", masked === "" ? null : masked, { shouldValidate: true });
                }}
                disabled={isLoading}
              />
              {errors.birth_date && (
                <p className="text-sm text-destructive">{errors.birth_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="text"
                inputMode="numeric"
                maxLength={15}
                placeholder="(00) 00000-0000"
                {...register("phone")}
                onChange={(e) => {
                  const masked = maskPhone(e.target.value);
                  setValue("phone", masked, { shouldValidate: true });
                }}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Valor por hora</Label>
              <Input
                id="hourly_rate"
                type="text"
                placeholder="Ex: 120,00"
                {...register("hourly_rate")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classes_per_week">Aulas por semana</Label>
              <Input
                id="classes_per_week"
                type="number"
                min={0}
                max={14}
                placeholder="Ex: 1, 2, 3..."
                {...register("classes_per_week")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay_day">Dia de pagamento</Label>
              <Input
                id="pay_day"
                type="number"
                min={1}
                max={31}
                placeholder="1 a 31"
                {...register("pay_day")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Origem do Aluno *</Label>
              <Select
                value={selectedOrigin}
                onValueChange={(value) => {
                  setSelectedOrigin(value);
                  setValue("origin", value as any, { shouldValidate: true });
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="passante">Passante</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              {!selectedOrigin && (
                <p className="text-sm text-destructive">Selecione uma origem</p>
              )}
            </div>

            {student && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <Button type="submit" disabled={isLoading || !selectedOrigin}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : student ? (
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
