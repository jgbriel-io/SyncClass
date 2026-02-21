import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Student, StudentInsert } from "@/hooks/useStudents";
import type { Enums } from "@/integrations/supabase/types";
import { BR_STATES, fetchIbgeCitiesByUf, BrCityOption, BrStateCode } from "@/lib/br-locations";
import { COMMON_COUNTRIES } from "@/lib/countries";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronsUpDown, CalendarIcon } from "lucide-react";
import { REGEX_PATTERNS, maskPhone, brDateStringToDate, isValidDateString, isMasked } from "@/lib/utils/patterns";
import { removeCountryCode } from "@/lib/utils/format-phone";
import { useDateMask } from "@/hooks/useDateMask";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { emailSchema } from "@/lib/validation/email";

// Type for student origin from database enum
type StudentOrigin = Enums<"student_origin">;
type StudentStatus = Enums<"student_status">;

function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

// Schema base para todos os alunos
const baseStudentSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: emailSchema,
  hourly_rate: z.string().optional().nullable(),
  pay_day: z.string().optional().nullable(),
  origin: z.enum(["indicacao", "google", "instagram", "passante", "outro"]),
  status: z.enum(["ativo", "inativo"]).optional(),
  birth_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || isValidDateString(val), {
      message: "Data inválida",
    }),
});

// Schema unificado para todos os alunos (brasileiro e estrangeiro)
const studentSchema = baseStudentSchema.extend({
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

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSubmit: (data: StudentInsert) => void;
  isLoading?: boolean;
  autoTeacherId?: string | null;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSubmit,
  isLoading,
  autoTeacherId,
}: StudentFormDialogProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<StudentOrigin | "">(
    student?.origin || ""
  );
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus>(
    student?.status || "ativo"
  );
  const [selectedCountry, setSelectedCountry] = useState<string>("Brasil");
  const [selectedState, setSelectedState] = useState<string>(student?.state || "");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [cities, setCities] = useState<BrCityOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Detecta se Brasil foi selecionado (para mostrar inputs do IBGE)
  const isBrazilSelected = selectedCountry.toLowerCase() === "brasil" || 
    selectedCountry.toLowerCase() === "brazil";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: student?.name || "",
      country: student?.country || "Brasil",
      state: student?.state || "",
      city: student?.city || "",
      phone: student?.phone
        ? (isMasked(student.phone) ? student.phone : student.phone.includes("(") ? student.phone : maskPhone(student.phone))
        : "",
      email: student?.email || "",
      hourly_rate: student?.hourly_rate
        ? String(student.hourly_rate).replace(".", ",")
        : "",
      pay_day: student?.pay_day ? String(student.pay_day) : "",
      origin: student?.origin || undefined,
      status: student?.status || "ativo",
      birth_date: student?.birth_date
        ? format(new Date(student.birth_date + "T00:00:00"), "dd/MM/yyyy")
        : null,
    },
  });

  const watchedCity = watch("city") || "";
  const watchedState = watch("state") || "";
  const birthDate = watch("birth_date");
  const { handleChange: handleDateChange, handleKeyDown: handleDateKeyDown } = useDateMask(
    (value, options) => setValue("birth_date", value, options)
  );

  useEffect(() => {
    // Sempre que o diálogo é fechado, garantimos que o formulário volte para o estado "novo aluno"
    if (!open) {
      reset({
        name: "",
        country: "Brasil",
        state: "",
        city: "",
        phone: "",
        email: "",
        hourly_rate: "",
        pay_day: "",
        origin: undefined,
        status: "ativo",
        birth_date: null,
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedCountry("Brasil");
      setSelectedState("");
      setValue("country", "Brasil", { shouldValidate: false });
      return;
    }

    if (student) {
      const formattedPhone = student.phone
        ? (isMasked(student.phone) ? student.phone : student.phone.includes("(") ? student.phone : maskPhone(student.phone))
        : "";

      reset({
        name: student.name,
        country: student.country || "Brasil",
        state: student.state || "",
        city: student.city || "",
        phone: formattedPhone,
        email: student.email || "",
        hourly_rate: student.hourly_rate
          ? String(student.hourly_rate).replace(".", ",")
          : "",
        pay_day: student.pay_day ? String(student.pay_day) : "",
        origin: student.origin || undefined,
        status: student.status || "ativo",
        birth_date: student.birth_date
          ? format(new Date(student.birth_date + "T00:00:00"), "dd/MM/yyyy")
          : null,
      });
      setSelectedOrigin(student.origin || "");
      setSelectedStatus(student.status || "ativo");
      setSelectedCountry(student.country || "Brasil");
      setSelectedState(student.state || "");
      setValue("country", student.country || "Brasil", { shouldValidate: false });
    } else {
      reset({
        name: "",
        country: "Brasil",
        state: "",
        city: "",
        phone: "",
        email: "",
        hourly_rate: "",
        pay_day: "",
        origin: undefined,
        status: "ativo",
        birth_date: null,
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedCountry("Brasil");
      setSelectedState("");
      setValue("country", "Brasil", { shouldValidate: false });
    }
  }, [student, open, reset, setValue]);

  useEffect(() => {
    if (isBrazilSelected) {
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
  }, [selectedState, isBrazilSelected]);



  const handleFormSubmit = (data: StudentFormData) => {
    const hourlyRateNumber = data.hourly_rate
      ? parseFloat(data.hourly_rate.replace(/[^.\d,]/g, "").replace(",", "."))
      : null;

    const payDayNumber = data.pay_day ? Number(data.pay_day) : null;

    const omitPhoneOnEdit = student && data.phone.trim() === "";

    // Para Brasil: remove máscara e salva apenas dígitos (DDD + número)
    // Para outros países: salva exatamente como digitado (com DDI)
    const normalizedPhone = data.phone 
      ? (isBrazilSelected ? data.phone.replace(/\D/g, "") : data.phone.trim())
      : null;

    const submitData: StudentInsert = {
      name: data.name,
      country: selectedCountry,
      state: isBrazilSelected ? (selectedState || null) : (data.state || null),
      city: data.city || null,
      ...(omitPhoneOnEdit ? {} : { phone: normalizedPhone || null }),
      email: data.email,
      origin: selectedOrigin as StudentOrigin,
      status: selectedStatus,
      birth_date: data.birth_date ? brDateToIso(data.birth_date) : null,
      hourly_rate: hourlyRateNumber,
      pay_day: payDayNumber,
      teacher_id: (autoTeacherId && !student) ? autoTeacherId : null,
    };

    onSubmit(submitData);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={student ? "Editar Aluno" : "Cadastrar Novo Aluno"}
      size="MD"
    >
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
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>

            {/* Estado - IBGE para Brasil, texto livre para outros */}
            {isBrazilSelected ? (
              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF) *</Label>
                <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full min-w-0 justify-between",
                        errors.state && "border-destructive"
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
                  <p className="text-sm text-destructive">{errors.state.message}</p>
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
                  <p className="text-sm text-destructive">{errors.state.message}</p>
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
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full min-w-0 justify-between",
                        errors.city && "border-destructive"
                      )}
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
                  <p className="text-sm text-destructive">{errors.city.message}</p>
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
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
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
                <p className="text-sm text-destructive">{errors.birth_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="text"
                inputMode={isBrazilSelected ? "numeric" : "text"}
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
                id="hourly_rate_valor"
                type="text"
                placeholder="Ex: 120,00"
                {...register("hourly_rate")}
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
              {errors.origin && (
                <p className="text-sm text-destructive">{errors.origin.message}</p>
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
    </BaseDialog>
  );
}
