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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { BR_STATES, fetchIbgeCitiesByUf, BrCityOption, BrStateCode } from "@/lib/br-locations";
import { StudentInsert } from "@/hooks/useStudents";
import { TeacherInsert } from "@/hooks/useTeachers";

// Mask and validation helpers
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

function maskDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  else if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  else if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  else return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : digits;
  else if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  else if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  else return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;

function maskMoney(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, "");
  
  if (!digits) return "";
  
  // Converte para centavos
  const cents = parseInt(digits);
  
  // Formata como moeda brasileira
  const formatted = (cents / 100).toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  return formatted;
}

// Simple schema - we'll do manual validation for student/teacher specific fields
const userSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z.string().optional(),
  fullName: z.string().min(1, "Nome é obrigatório"),
  role: z.enum(["admin", "student", "teacher"]),
  // Optional fields - make them truly optional
  cpf: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  hourly_rate: z.string().optional().or(z.literal("")),
  classes_per_week: z.string().optional().or(z.literal("")),
  pay_day: z.string().optional().or(z.literal("")),
  origin: z.string().optional().or(z.literal("")),
  status: z.string().optional().or(z.literal("")),
  birth_date: z.string().optional().nullable().or(z.literal("")),
});

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithProfile | null;
  onSubmit: (data: {
    email: string;
    password?: string;
    fullName: string;
    role: "admin" | "student" | "teacher";
    studentData?: Partial<StudentInsert>;
    teacherData?: Partial<TeacherInsert>;
  }) => void;
  isLoading: boolean;
  initialRole?: "admin" | "student" | "teacher";
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading,
  initialRole,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const [selectedRole, setSelectedRole] = useState<"admin" | "student" | "teacher">(
    initialRole || (user?.role?.role as any) || "admin",
  );
  const [selectedOrigin, setSelectedOrigin] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ativo");
  const [selectedState, setSelectedState] = useState<string>("");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [cities, setCities] = useState<BrCityOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    mode: "onSubmit",
    defaultValues: {
      email: user?.email || "",
      password: "",
      fullName: user?.profile?.full_name || "",
      role: user?.role?.role || initialRole || "admin",
      cpf: "",
      phone: "",
      state: "",
      city: "",
      hourly_rate: "",
      classes_per_week: "",
      pay_day: "",
      origin: "",
      status: "ativo",
      birth_date: "",
    },
  });

  const watchedCity = watch("city") || "";

  // Load cities when state changes
  useEffect(() => {
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
  }, [selectedState]);

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
      const defaultRole = initialRole || "admin";
      reset({
        email: "",
        password: "",
        fullName: "",
        role: defaultRole,
        // Student defaults
        cpf: "",
        phone: "",
        state: "",
        city: "",
        hourly_rate: "",
        classes_per_week: "",
        pay_day: "",
        origin: undefined,
        status: "ativo",
        birth_date: null,
      });
      setSelectedRole(defaultRole);
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedState("");
    }
  }, [user, reset, initialRole]);

  const handleFormSubmit = (data: any) => {
    // Clear previous custom errors
    setCustomErrors({});
    
    // Validate student-specific required fields
    if (selectedRole === "student") {
      const errors: Record<string, string> = {};
      
      if (!data.cpf || data.cpf.trim() === "") {
        errors.cpf = "CPF é obrigatório";
      } else if (!cpfRegex.test(data.cpf)) {
        errors.cpf = "Formato deve ser 000.000.000-00";
      }
      
      if (!data.phone || data.phone.trim() === "") {
        errors.phone = "Telefone é obrigatório";
      } else if (!phoneRegex.test(data.phone)) {
        errors.phone = "Formato deve ser (00) 00000-0000";
      }
      
      if (!selectedOrigin) {
        errors.origin = "Selecione uma origem";
      }
      
      if (data.birth_date && data.birth_date.trim() !== "") {
        if (!dateRegex.test(data.birth_date)) {
          errors.birth_date = "Formato deve ser dd/mm/aaaa";
        } else if (!isValidDateString(data.birth_date)) {
          errors.birth_date = "Data inválida";
        }
      }
      
      if (Object.keys(errors).length > 0) {
        setCustomErrors(errors);
        return;
      }
    }

    const baseData = {
      email: data.email,
      password: data.password || undefined,
      fullName: data.fullName,
      role: selectedRole,
    };

    if (selectedRole === "student") {
      const hourlyRateNumber = data.hourly_rate
        ? parseFloat(data.hourly_rate.replace(/[^.\d,]/g, "").replace(",", "."))
        : null;
      const classesPerWeekNumber = data.classes_per_week ? Number(data.classes_per_week) : null;
      const payDayNumber = data.pay_day ? Number(data.pay_day) : null;

      onSubmit({
        ...baseData,
        studentData: {
          cpf: data.cpf,
          phone: data.phone,
          state: selectedState || null,
          city: data.city || null,
          origin: selectedOrigin as StudentInsert["origin"],
          status: selectedStatus as StudentInsert["status"],
          birth_date: data.birth_date ? brDateToIso(data.birth_date) : null,
          hourly_rate: hourlyRateNumber,
          classes_per_week: classesPerWeekNumber,
          pay_day: payDayNumber,
        },
      });
    } else if (selectedRole === "teacher") {
      onSubmit({
        ...baseData,
        teacherData: {
          phone: data.phone || undefined,
        },
      });
    } else {
      onSubmit(baseData);
    }
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value as "admin" | "student" | "teacher");
    setValue("role", value as "admin" | "student" | "teacher");
    setCustomErrors({}); // Clear custom errors when changing role
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
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
        <form 
          onSubmit={handleSubmit(handleFormSubmit)} 
          className="space-y-4"
        >
          <input type="hidden" {...register("role")} />
          
          {/* Common fields for all roles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
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
                {...register("fullName", { required: "Nome é obrigatório" })}
                disabled={isLoading}
                required
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message as string}</p>
              )}
            </div>

            <div className={selectedRole === "admin" ? "sm:col-span-2" : ""}>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                {...register("email", { required: "Email é obrigatório" })}
                disabled={isLoading || !!user}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message as string}</p>
              )}
            </div>

            {/* Phone field for student and teacher */}
            {(selectedRole === "student" || selectedRole === "teacher") && (
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefone {selectedRole === "student" ? "*" : ""}
                </Label>
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
                    if (customErrors.phone) {
                      setCustomErrors(prev => ({ ...prev, phone: "" }));
                    }
                  }}
                  disabled={isLoading}
                />
                {(errors.phone || customErrors.phone) && (
                  <p className="text-sm text-destructive">
                    {customErrors.phone || (errors.phone?.message as string)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Student-specific fields */}
          {selectedRole === "student" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
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
                      if (customErrors.cpf) {
                        setCustomErrors(prev => ({ ...prev, cpf: "" }));
                      }
                    }}
                    disabled={isLoading}
                  />
                  {(errors.cpf || customErrors.cpf) && (
                    <p className="text-sm text-destructive">
                      {customErrors.cpf || (errors.cpf?.message as string)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="dd/mm/aaaa"
                    {...register("birth_date")}
                    onChange={(e) => {
                      const masked = maskDate(e.target.value);
                      setValue("birth_date", masked, { shouldValidate: true });
                      if (customErrors.birth_date) {
                        setCustomErrors(prev => ({ ...prev, birth_date: "" }));
                      }
                    }}
                    disabled={isLoading}
                  />
                  {(errors.birth_date || customErrors.birth_date) && (
                    <p className="text-sm text-destructive">
                      {customErrors.birth_date || (errors.birth_date?.message as string)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
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
                          className="w-full justify-between"
                          disabled={isLoading}
                        >
                          {(() => {
                            const current = BR_STATES.find((st) => st.code === selectedState);
                            if (current) return `${current.code} - ${current.name}`;
                            return "Selecione UF";
                          })()}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
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
                          className="w-full justify-between"
                          disabled={!selectedState || isLoading || isLoadingCities}
                        >
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
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
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

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Valor por hora</Label>
                  <Input
                    id="hourly_rate"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 120,00"
                    {...register("hourly_rate")}
                    onChange={(e) => {
                      const masked = maskMoney(e.target.value);
                      setValue("hourly_rate", masked);
                    }}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classes_per_week">Aulas/semana</Label>
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Origem do Aluno *</Label>
                  <Select
                    value={selectedOrigin}
                    onValueChange={(value) => {
                      setSelectedOrigin(value);
                      setValue("origin", value as any, { shouldValidate: true });
                      if (customErrors.origin) {
                        setCustomErrors(prev => ({ ...prev, origin: "" }));
                      }
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
                  {customErrors.origin && (
                    <p className="text-sm text-destructive">{customErrors.origin}</p>
                  )}
                </div>

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
              </div>
            </>
          )}

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
                <p className="text-sm text-destructive">{errors.password.message as string}</p>
              )}
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
              disabled={isLoading || isSubmitting}
            >
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
