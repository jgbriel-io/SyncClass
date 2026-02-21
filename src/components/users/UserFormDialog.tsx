import { useEffect, useMemo, useState } from "react";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { emailSchema } from "@/lib/validation/email";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { COMMON_COUNTRIES } from "@/lib/countries";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { REGEX_PATTERNS, maskPhone, brDateStringToDate, isValidDateString } from "@/lib/utils/patterns";
import { removeCountryCode } from "@/lib/utils/format-phone";
import { useDateMask } from "@/hooks/useDateMask";
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

// Schema base para alunos
const baseStudentSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: emailSchema,
  hourly_rate: z.string().min(1, "Valor por hora é obrigatório"),
  pay_day: z.string().min(1, "Dia de pagamento é obrigatório"),
  origin: z.enum(["indicacao", "google", "instagram", "passante", "outro"]),
  status: z.enum(["ativo", "inativo"]).optional(),
  birth_date: z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((val) => isValidDateString(val), {
      message: "Data inválida",
    }),
  role: z.literal("student"),
});

// Schema para alunos BRASILEIROS
const brazilianStudentSchema = baseStudentSchema.extend({
  country: z.literal("Brasil").optional(),
  state: z.string().min(2, "Estado é obrigatório").max(2),
  city: z.string().min(2, "Cidade é obrigatória").max(100),
  phone: z.string()
    .min(1, "Telefone é obrigatório")
    .refine(
      (v) => {
        return (v.length === 14 || v.length === 15) && REGEX_PATTERNS.phone.test(v);
      },
      "Telefone deve ter 10 ou 11 dígitos no formato (00) 00000-0000"
    ),
});

// Schema para alunos ESTRANGEIROS
const foreignStudentSchema = baseStudentSchema.extend({
  country: z.string().min(2, "País é obrigatório").max(100),
  state: z.string().min(1, "Estado/Região é obrigatório").max(100),
  city: z.string().min(1, "Cidade é obrigatória").max(100),
  phone: z.string()
    .min(1, "Telefone é obrigatório")
    .refine(
      (v) => {
        const digitsOnly = v.replace(/\D/g, "");
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
      },
      "Telefone deve ter entre 7 e 15 dígitos"
    ),
});

// Manter compatibilidade
const studentSchema = brazilianStudentSchema;

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
    country: string;
    state: string | null;
    city: string | null;
    cpf: string | null;
    phone: string | null;
    email: string;
    origin: StudentOrigin;
    status: StudentStatus;
    birth_date: string | null;
    hourly_rate: number | null;
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
  };
}

type UserFormSubmitData = AdminSubmitData | StudentSubmitData | TeacherSubmitData;

// Helper para extrair mensagem de erro
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getErrorMessage = (errors: FieldErrors<any>, field: string): string | undefined => {
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
  const [selectedCountry, setSelectedCountry] = useState<string>("Brasil");
  const [selectedState, setSelectedState] = useState<string>("");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [cities, setCities] = useState<BrCityOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Detecta se Brasil foi selecionado (para mostrar inputs do IBGE)
  const isBrazilSelected = selectedCountry.toLowerCase() === "brasil" || 
    selectedCountry.toLowerCase() === "brazil";

  const currentSchema = useMemo(() => {
    if (selectedRole === "admin") return adminSchema;
    if (selectedRole === "student") return foreignStudentSchema;
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
  const { handleChange: handleDateChange, handleKeyDown: handleDateKeyDown } = useDateMask(
    (value, options) => setValue("birth_date", value, options)
  );

  useEffect(() => {
    if (selectedRole === "student" && isBrazilSelected) {
      const loadCities = async () => {
        if (!selectedState || selectedState.length !== 2) {
          setCities([]);
          return;
        }

        setIsLoadingCities(true);
        const result = await fetchIbgeCitiesByUf(selectedState as BrStateCode);
        setCities(result);
        setIsLoadingCities(false);
      };

      void loadCities();
    } else {
      setCities([]);
    }
  }, [selectedState, selectedRole, isBrazilSelected]);

  useEffect(() => {
    // Apenas resetar quando o modal ABRE, não quando fecha
    if (!open) {
      return;
    }

    if (user) {
      const userRole = (user.role?.role as AppRole) || "admin";
      setSelectedRole(userRole);

      if (userRole === "admin") {
        reset({
          email: user.email,
          fullName: user.profile?.full_name || "",
          role: "admin",
        });
      } else if (userRole === "student" && user.student) {
        // Carregar dados do student
        const student = user.student;
        
        reset({
          name: student.name || "",
          email: student.email || user.email,
          phone: student.phone || "",
          state: student.state || "",
          city: student.city || "",
          birth_date: student.birth_date 
            ? format(new Date(student.birth_date), "dd/MM/yyyy", { locale: ptBR })
            : null,
          hourly_rate: student.hourly_rate ? String(student.hourly_rate) : "",
          pay_day: student.pay_day ? String(student.pay_day) : "",
          origin: (student.origin as StudentOrigin) || "outro",
          status: (student.status as StudentStatus) || "ativo",
          role: "student",
        });
        setSelectedOrigin((student.origin as StudentOrigin) || "outro");
        setSelectedStatus((student.status as StudentStatus) || "ativo");
        setSelectedCountry(student.country || "Brasil");
        setSelectedState(student.state || "");
        setValue("country", student.country || "Brasil", { shouldValidate: false });
      } else if (userRole === "teacher" && user.teacher) {
        // Carregar dados do teacher
        const teacher = user.teacher;
        
        reset({
          name: teacher.name || "",
          email: teacher.email || user.email,
          phone: teacher.phone || "",
          role: "teacher",
        });
      }
    } else {
      // Modo criação
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
          phone: "",
          state: "",
          city: "",
          birth_date: null,
          hourly_rate: "",
          pay_day: "",
          origin: "outro",
          status: "ativo",
          role: "student",
        });
        setSelectedOrigin("");
        setSelectedStatus("ativo");
        setSelectedCountry("Brasil");
        setSelectedState("");
        setValue("country", "Brasil", { shouldValidate: false });
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          role: "teacher",
        });
      }
    }
  }, [user, open, reset, selectedRole, setValue]);

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
        phone: "",
        state: "",
        city: "",
        birth_date: null,
        hourly_rate: "",
        pay_day: "",
        origin: "outro",
        status: "ativo",
        role: "student",
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedCountry("Brasil");
      setSelectedState("");
      setValue("country", "Brasil", { shouldValidate: false });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
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
    } else if (selectedRole === "student" && "name" in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studentData = data as any;
      const hourlyRateNumber = studentData.hourly_rate
        ? parseFloat(studentData.hourly_rate.replace(/[^.\d,]/g, "").replace(",", "."))
        : null;

      const payDayNumber = studentData.pay_day ? Number(studentData.pay_day) : null;

      // Normalizar telefone: remove DDI se o usuário digitou (ex: +1 ou +55)
      // Salva apenas o número local no banco (ex: "2133734253" sem o +1)
      
      // Para remover o DDI, usa o país selecionado
      const normalizedPhone = studentData.phone 
        ? removeCountryCode(studentData.phone, selectedCountry)
        : null;

      onSubmit({
        email: data.email,
        fullName: studentData.name,
        role: "student",
        studentData: {
          name: studentData.name,
          country: selectedCountry,
          state: isBrazilSelected ? (selectedState || null) : (studentData.state || null),
          city: studentData.city || null,
          phone: normalizedPhone || null,
          email: data.email,
          origin: selectedOrigin as StudentOrigin,
          status: selectedStatus,
          birth_date: studentData.birth_date ? brDateToIso(studentData.birth_date) : null,
          hourly_rate: hourlyRateNumber,
          pay_day: payDayNumber,
        },
      });
    } else if (selectedRole === "teacher" && "name" in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teacherData = data as any;
      // Normalizar telefone: remove DDI se o usuário digitou
      const normalizedPhone = teacherData.phone && teacherData.phone.trim().length > 0 
        ? removeCountryCode(teacherData.phone, "Brasil")
        : undefined;

      const teacherSubmitData: {
        name: string;
        email: string;
        phone?: string;
      } = {
        name: teacherData.name,
        email: data.email,
      };

      if (normalizedPhone) {
        teacherSubmitData.phone = normalizedPhone;
      }

      onSubmit({
        email: data.email,
        fullName: teacherData.name,
        role: "teacher",
        teacherData: teacherSubmitData,
      });
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={user ? "Editar Usuário" : "Novo Usuário"}
      size={selectedRole === "admin" ? "SM" : "MD"}
    >
        
        {!isEdit && (
          <div>
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

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <input type="hidden" {...register("role")} />

          {/* Formulário ADMIN */}
          {selectedRole === "admin" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
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

              <div className="sm:col-span-2 space-y-2">
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
            </div>
          )}

          {/* Formulário STUDENT - Unificado */}
          {selectedRole === "student" && (
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

              {/* País */}
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countryPopoverOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !selectedCountry && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <span className="min-w-0 truncate">
                        {selectedCountry || "Selecione o país"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar país..." />
                      <CommandList>
                        <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
                        <CommandGroup>
                          {COMMON_COUNTRIES.map((country) => (
                            <CommandItem
                              key={country.code}
                              value={country.name}
                              onSelect={() => {
                                setSelectedCountry(country.name);
                                setValue("country", country.name, { shouldValidate: true });
                                setSelectedState("");
                                setValue("state", "", { shouldValidate: false });
                                setValue("city", "", { shouldValidate: false });
                                setCountryPopoverOpen(false);
                              }}
                            >
                              {country.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.country && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "country")}</p>
                )}
              </div>

              {/* Estado - IBGE para Brasil, texto livre para outros */}
              {isBrazilSelected ? (
                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF) *</Label>
                  <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statePopoverOpen}
                        className={cn(
                          "w-full justify-between font-normal",
                          !selectedState && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        <span className="min-w-0 truncate">
                          {BR_STATES.find(s => s.code === selectedState)?.name || "Selecione o estado"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar estado..." />
                        <CommandList>
                          <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                          <CommandGroup>
                            {BR_STATES.map((state) => (
                              <CommandItem
                                key={state.code}
                                value={`${state.name} ${state.code}`}
                                onSelect={() => {
                                  setSelectedState(state.code);
                                  setValue("state", state.code, { shouldValidate: true });
                                  setValue("city", "", { shouldValidate: false });
                                  setStatePopoverOpen(false);
                                }}
                              >
                                <span className="mr-2 text-xs opacity-50">{state.code}</span>
                                <span>{state.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.state && (
                    <p className="text-sm text-destructive">{getErrorMessage(errors, "state")}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="state">Estado/Região *</Label>
                  <Input
                    id="state"
                    placeholder="Ex: California, Ontario"
                    {...register("state")}
                    disabled={isLoading}
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive">{getErrorMessage(errors, "state")}</p>
                  )}
                </div>
              )}

              {/* Cidade - IBGE para Brasil, texto livre para outros */}
              {isBrazilSelected ? (
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={cityPopoverOpen}
                        className={cn(
                          "w-full justify-between font-normal",
                          !watchedCity && "text-muted-foreground"
                        )}
                        disabled={isLoading || !selectedState || isLoadingCities}
                      >
                        <span className="min-w-0 truncate">
                          {isLoadingCities
                            ? "Carregando cidades..."
                            : watchedCity || "Selecione a cidade"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
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
                  {errors.city && (
                    <p className="text-sm text-destructive">{getErrorMessage(errors, "city")}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    placeholder="Ex: Londres, Paris, Nova York"
                    {...register("city")}
                    disabled={isLoading}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{getErrorMessage(errors, "city")}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                <div className="flex gap-2">
                  <Input
                    id="birth_date"
                    type="text"
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    value={birthDate || ""}
                    onChange={handleDateChange}
                    onKeyDown={handleDateKeyDown}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        disabled={isLoading}
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b flex items-center justify-center gap-2">
                        <Select
                          value={birthDate ? brDateStringToDate(birthDate)?.getFullYear().toString() : "2000"}
                          onValueChange={(year) => {
                            const currentDate = birthDate ? brDateStringToDate(birthDate) : new Date(2000, 0, 1);
                            const newDate = new Date(parseInt(year), currentDate?.getMonth() ?? 0, 1);
                            setValue("birth_date", format(newDate, "dd/MM/yyyy", { locale: ptBR }), { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Calendar
                        mode="single"
                        selected={brDateStringToDate(birthDate || "") ?? undefined}
                        onSelect={(date) => {
                          if (date) {
                            setValue("birth_date", format(date, "dd/MM/yyyy", { locale: ptBR }), { shouldValidate: true });
                          }
                        }}
                        locale={ptBR}
                        month={birthDate ? brDateStringToDate(birthDate) ?? new Date(2000, 0, 1) : new Date(2000, 0, 1)}
                        onMonthChange={() => {}}
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {errors.birth_date && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "birth_date")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="text"
                  inputMode={isBrazilSelected ? "numeric" : "text"}
                  maxLength={isBrazilSelected ? 15 : 20}
                  placeholder={isBrazilSelected ? "(00) 00000-0000" : "Ex: 555 123 4567"}
                  {...register("phone")}
                  onChange={(e) => {
                    if (isBrazilSelected) {
                      const masked = maskPhone(e.target.value);
                      setValue("phone", masked, { shouldValidate: true });
                    } else {
                      // Telefone internacional: usuário digita APENAS o número local (sem DDI)
                      setValue("phone", e.target.value, { shouldValidate: true });
                    }
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
                  disabled={isLoading || isEdit}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "email")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Valor por hora *</Label>
                <Input
                  id="hourly_rate_valor"
                  type="text"
                  placeholder="Ex: 120,00"
                  {...register("hourly_rate")}
                  disabled={isLoading}
                />
                {errors.hourly_rate && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "hourly_rate")}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay_day">Dia de pagamento *</Label>
                <Input
                  id="pay_day"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="1 a 31"
                  {...register("pay_day")}
                  disabled={isLoading}
                />
                {errors.pay_day && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "pay_day")}</p>
                )}
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
                {errors.origin && (
                  <p className="text-sm text-destructive">{getErrorMessage(errors, "origin")}</p>
                )}
              </div>
            </div>
          )}

          {/* Formulário TEACHER - Completo */}
          {selectedRole === "teacher" && (
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

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  {...register("email")}
                  disabled={isLoading || isEdit}
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
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
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
    </BaseDialog>
  );
}
