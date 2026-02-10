import { useEffect, useMemo, useState } from "react";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { emailSchema } from "@/lib/validation/email";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { UserWithProfile } from "@/hooks/useUsers";
import type { Enums } from "@/integrations/supabase/types";
import { BR_STATES, fetchIbgeCitiesByUf, BrCityOption, BrStateCode } from "@/lib/br-locations";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { REGEX_PATTERNS, maskCPF, maskPhone, brDateStringToDate, isValidDateString } from "@/lib/utils/patterns";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type AppRole = Enums<"app_role">;
type StudentOrigin = Enums<"student_origin">;
type StudentStatus = Enums<"student_status">;

function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

// Schema para Admin (simples)
const adminSchema = z.object({
  email: emailSchema,
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.literal("admin"),
});

// Schema para Student (completo)
const studentSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  state: z.string().max(2).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  cpf: z.string()
    .min(14, "CPF inválido")
    .max(14, "CPF inválido")
    .regex(REGEX_PATTERNS.cpf, "Formato deve ser 000.000.000-00"),
  phone: z.string()
    .min(14, "Telefone inválido")
    .max(15, "Telefone inválido")
    .regex(REGEX_PATTERNS.phone, "Formato deve ser (00) 00000-0000"),
  email: emailSchema,
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
    .refine((val) => !val || isValidDateString(val), {
      message: "Data inválida",
    }),
  role: z.literal("student"),
});

// Schema para Teacher (completo)
const teacherSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: emailSchema,
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      return val.length >= 14 && val.length <= 15 && REGEX_PATTERNS.phone.test(val);
    }, {
      message: "Telefone deve estar no formato (00) 00000-0000 ou (00) 0000-0000",
    }),
  cpf: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true;
      return val.length === 14 && REGEX_PATTERNS.cpf.test(val);
    }, {
      message: "CPF deve estar no formato 000.000.000-00",
    }),
  role: z.literal("teacher"),
});

type AdminFormData = z.infer<typeof adminSchema>;
type StudentFormData = z.infer<typeof studentSchema>;
type TeacherFormData = z.infer<typeof teacherSchema>;
type FormData = AdminFormData | StudentFormData | TeacherFormData;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithProfile | null;
  onSubmit: (data: UserFormSubmitData) => void;
  isLoading: boolean;
}

// Tipos para o submit data
interface AdminSubmitData {
  email: string;
  fullName: string;
  role: "admin";
}

interface StudentSubmitData {
  email: string;
  fullName: string;
  role: "student";
  studentData: {
    name: string;
    state: string | null;
    city: string | null;
    cpf: string;
    phone: string;
    email: string;
    origin: StudentOrigin;
    status: StudentStatus;
    birth_date: string | null;
    hourly_rate: number | null;
    classes_per_week: number | null;
    pay_day: number | null;
  };
}

interface TeacherSubmitData {
  email: string;
  fullName: string;
  role: "teacher";
  teacherData: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
  };
}

type UserFormSubmitData = AdminSubmitData | StudentSubmitData | TeacherSubmitData;

// Helper para extrair mensagem de erro
const getErrorMessage = (errors: FieldErrors<FormData>, field: keyof FormData): string | undefined => {
  const error = errors[field];
  return error?.message as string | undefined;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const [selectedRole, setSelectedRole] = useState<AppRole>(
    (user?.role?.role as AppRole) || "admin",
  );

  // States para student
  const [selectedOrigin, setSelectedOrigin] = useState<StudentOrigin | "">("");
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus>("ativo");
  const [selectedState, setSelectedState] = useState<string>("");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [cities, setCities] = useState<BrCityOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const currentSchema = useMemo(() => {
    if (selectedRole === "admin") return adminSchema;
    if (selectedRole === "student") return studentSchema;
    return teacherSchema;
  }, [selectedRole]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      email: user?.email || "",
      fullName: user?.profile?.full_name || "",
      name: user?.profile?.full_name || "",
      role: selectedRole,
    },
  });

  const watchedCity = watch("city") || "";
  const birthDate = watch("birth_date");

  useEffect(() => {
    if (selectedRole === "student") {
      const loadCities = async () => {
        if (!selectedState) {
          setCities([]);
          return;
        }

        setIsLoadingCities(true);
        const result = await fetchIbgeCitiesByUf(selectedState as BrStateCode);
        setCities(result);
        setIsLoadingCities(false);
      };

      void loadCities();
    }
  }, [selectedState, selectedRole]);

  useEffect(() => {
    if (!open) {
      reset({
        email: "",
        fullName: "",
        name: "",
        role: "admin",
      });
      setSelectedRole("admin");
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedState("");
      return;
    }

    if (user) {
      reset({
        email: user.email,
        fullName: user.profile?.full_name || "",
        role: (user.role?.role as AppRole) || "admin",
      });
      setSelectedRole((user.role?.role as AppRole) || "admin");
    } else {
      if (selectedRole === "admin") {
        reset({
          email: "",
          fullName: "",
          role: "admin",
        });
      } else if (selectedRole === "student") {
        reset({
          name: "",
          email: "",
          cpf: "",
          phone: "",
          state: "",
          city: "",
          birth_date: null,
          hourly_rate: "",
          classes_per_week: "",
          pay_day: "",
          origin: "outro",
          status: "ativo",
          role: "student",
        });
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          cpf: "",
          role: "teacher",
        });
      }

      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedState("");
    }
  }, [user, open, reset, selectedRole]);

  const handleRoleChange = (value: string) => {
    const newRole = value as AppRole;
    setSelectedRole(newRole);
    setValue("role", newRole);

    // Reset form com defaults do novo role

    if (newRole === "admin") {
      reset({
        email: "",
        fullName: "",
        role: "admin",
      });
    } else if (newRole === "student") {
      reset({
        name: "",
        email: "",
        cpf: "",
        phone: "",
        state: "",
        city: "",
        birth_date: null,
        hourly_rate: "",
        classes_per_week: "",
        pay_day: "",
        origin: "outro",
        status: "ativo",
        role: "student",
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedState("");
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        role: "teacher",
      });
    }
  };

  const handleFormSubmit = (data: FormData) => {
    if (selectedRole === "admin" && "fullName" in data) {
      onSubmit({
        email: data.email,
        fullName: data.fullName,
        role: "admin",
      });
    } else if (selectedRole === "student" && "name" in data && "cpf" in data) {
      const hourlyRateNumber = data.hourly_rate
        ? parseFloat(data.hourly_rate.replace(/[^.\d,]/g, "").replace(",", "."))
        : null;

      const classesPerWeekNumber = data.classes_per_week
        ? Number(data.classes_per_week)
        : null;

      const payDayNumber = data.pay_day ? Number(data.pay_day) : null;

      onSubmit({
        email: data.email,
        fullName: data.name,
        role: "student",
        studentData: {
          name: data.name,
          state: selectedState || null,
          city: data.city || null,
          cpf: data.cpf,
          phone: data.phone,
          email: data.email,
          origin: selectedOrigin as StudentOrigin,
          status: selectedStatus,
          birth_date: data.birth_date ? brDateToIso(data.birth_date) : null,
          hourly_rate: hourlyRateNumber,
          classes_per_week: classesPerWeekNumber,
          pay_day: payDayNumber,
        },
      });
    } else if (selectedRole === "teacher" && "name" in data) {
      const teacherData: {
        name: string;
        email: string;
        phone?: string;
        cpf?: string;
      } = {
        name: data.name,
        email: data.email,
      };

      // Apenas adicionar phone/cpf se tiverem conteúdo (não vazios)
      if (data.phone && data.phone.trim().length > 0) {
        teacherData.phone = data.phone;
      }
      if (data.cpf && data.cpf.trim().length > 0) {
        teacherData.cpf = data.cpf;
      }

      onSubmit({
        email: data.email,
        fullName: data.name,
        role: "teacher",
        teacherData,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={selectedRole === "admin" ? "sm:max-w-md" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        
        {!isEdit && (
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
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <input type="hidden" {...register("role")} />

          {/* Formulário ADMIN */}
          {selectedRole === "admin" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  {...register("email")}
                  disabled={isLoading || isEdit}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "email")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Nome do administrador"
                  {...register("fullName")}
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "fullName")}</p>
                )}
              </div>
            </>
          )}

          {/* Formulário STUDENT - Completo */}
          {selectedRole === "student" && !isEdit && (
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
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "name")}</p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label>Estado e cidade</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Estado (UF)</Label>
                    <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full min-w-0 justify-between"
                          disabled={isLoading}
                        >
                          <span className="min-w-0 truncate">
                            {(() => {
                              const current = BR_STATES.find((st) => st.code === selectedState);
                              if (current) return `${current.code} - ${current.name}`;
                              return "Selecione UF";
                            })()}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[260px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar estado ou UF..." />
                          <CommandList>
                            <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                            <CommandGroup>
                              {BR_STATES.map((st) => (
                                <CommandItem
                                  key={st.code}
                                  value={`${st.code} ${st.name}`}
                                  onSelect={() => {
                                    setSelectedState(st.code);
                                    setValue("state", st.code, { shouldValidate: true });
                                    setValue("city", "", { shouldValidate: true });
                                    setStatePopoverOpen(false);
                                  }}
                                >
                                  <span className="mr-2 font-mono text-xs">{st.code}</span>
                                  <span>{st.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Cidade</Label>
                    <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full min-w-0 justify-between"
                          disabled={!selectedState || isLoading || isLoadingCities}
                        >
                          <span className="min-w-0 truncate">
                            {(() => {
                              const cityValue = watchedCity;
                              const current = cities.find((c) => c.value === cityValue);
                              if (current) return current.label;
                              if (cityValue) return cityValue;
                              if (isLoadingCities) return "Carregando cidades...";
                              return selectedState
                                ? "Selecione a cidade"
                                : "Selecione uma UF primeiro";
                            })()}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar cidade..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                            <CommandGroup>
                              {cities.map((city) => (
                                <CommandItem
                                  key={city.value}
                                  value={city.label}
                                  onSelect={() => {
                                    setValue("city", city.value, { shouldValidate: true });
                                    setCityPopoverOpen(false);
                                  }}
                                >
                                  {city.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
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
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "cpf")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="birth_date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !birthDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthDate || "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={brDateStringToDate(birthDate || "") ?? undefined}
                      onSelect={(date) => {
                        if (date) {
                          setValue("birth_date", format(date, "dd/MM/yyyy", { locale: ptBR }), { shouldValidate: true });
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.birth_date && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "birth_date")}</p>
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
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "phone")}</p>
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
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "email")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Valor por hora</Label>
                <Input
                  id="hourly_rate_valor"
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
                    const origin = value as StudentOrigin;
                    setSelectedOrigin(origin);
                    setValue("origin", origin, { shouldValidate: true });
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
            </div>
          )}

          {/* Formulário TEACHER - Completo */}
          {selectedRole === "teacher" && !isEdit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  placeholder="Nome do professor"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "name")}</p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "email")}</p>
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
                  {...register("phone")}
                  onChange={(e) => {
                    const value = e.target.value;
                    const digits = value.replace(/\D/g, "").slice(0, 11);
                    let masked = digits;
                    if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                    if (digits.length > 6) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                    setValue("phone", masked, { shouldValidate: true });
                  }}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "phone")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
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
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "cpf")}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (selectedRole === "student" && !selectedOrigin)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Salvando..." : "Criando..."}
                </>
              ) : isEdit ? (
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
