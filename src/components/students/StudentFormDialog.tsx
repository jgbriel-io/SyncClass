import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronsUpDown, CalendarIcon } from "lucide-react";
import { REGEX_PATTERNS, maskCPF, maskPhone, brDateStringToDate, isValidDateString } from "@/lib/utils/patterns";
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

function isMasked(value: string | null | undefined): boolean {
  return typeof value === "string" && value.includes("*");
}

const studentSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  state: z.string().max(2).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  cpf: z.string()
    .refine((v) => {
      if (!v || v.trim() === "") return true;
      if (isMasked(v)) return true;
      return v.length === 14 && REGEX_PATTERNS.cpf.test(v);
    }, "CPF deve ter 11 dígitos no formato 000.000.000-00"),
  phone: z.string()
    .refine(
      (v) => {
        if (!v || v.trim() === "") return true;
        if (isMasked(v)) return true;
        return (v.length === 14 || v.length === 15) && REGEX_PATTERNS.phone.test(v);
      },
      "Telefone deve ter 10 ou 11 dígitos no formato (00) 00000-0000"
    ),
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
  const [selectedState, setSelectedState] = useState<string>(student?.state || "");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [cities, setCities] = useState<BrCityOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

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
      state: student?.state || "",
      city: student?.city || "",
      cpf: student?.cpf && !isMasked(student.cpf)
        ? (student.cpf.includes(".") ? student.cpf : maskCPF(student.cpf))
        : "",
      phone: student?.phone
        ? (isMasked(student.phone) ? student.phone : student.phone.includes("(") ? student.phone : maskPhone(student.phone))
        : "",
      email: student?.email || "",
      hourly_rate: student?.hourly_rate
        ? String(student.hourly_rate).replace(".", ",")
        : "",
      classes_per_week: student?.classes_per_week
        ? String(student.classes_per_week)
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
  const birthDate = watch("birth_date");

  useEffect(() => {
    // Sempre que o diálogo é fechado, garantimos que o formulário volte para o estado "novo aluno"
    if (!open) {
      reset({
        name: "",
        state: "",
        city: "",
        cpf: "",
        phone: "",
        email: "",
        hourly_rate: "",
        classes_per_week: "",
        pay_day: "",
        origin: undefined,
        status: "ativo",
        birth_date: null,
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedState("");
      return;
    }

    if (student) {
      const formattedCPF =
        student.cpf && !isMasked(student.cpf)
          ? (student.cpf.includes(".") ? student.cpf : maskCPF(student.cpf))
          : "";
      const formattedPhone = student.phone
        ? (isMasked(student.phone) ? student.phone : student.phone.includes("(") ? student.phone : maskPhone(student.phone))
        : "";

      reset({
        name: student.name,
        state: student.state || "",
        city: student.city || "",
        cpf: formattedCPF,
        phone: formattedPhone,
        email: student.email || "",
        hourly_rate: student.hourly_rate
          ? String(student.hourly_rate).replace(".", ",")
          : "",
        classes_per_week: student.classes_per_week
          ? String(student.classes_per_week)
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
      setSelectedState(student.state || "");
    } else {
      reset({
        name: "",
        state: "",
        city: "",
        cpf: "",
        phone: "",
        email: "",
        hourly_rate: "",
        classes_per_week: "",
        pay_day: "",
        origin: undefined,
        status: "ativo",
        birth_date: null,
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedState("");
    }
  }, [student, open, reset]);

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

  const handleFormSubmit = (data: StudentFormData) => {
    const hourlyRateNumber = data.hourly_rate
      ? parseFloat(data.hourly_rate.replace(/[^.\d,]/g, "").replace(",", "."))
      : null;

    const classesPerWeekNumber = data.classes_per_week
      ? Number(data.classes_per_week)
      : null;

    const payDayNumber = data.pay_day ? Number(data.pay_day) : null;

    const omitCpfOnEdit = student && (data.cpf.trim() === "" || !!autoTeacherId);
    const omitPhoneOnEdit = student && data.phone.trim() === "";

    const submitData: StudentInsert = {
      name: data.name,
      state: selectedState || null,
      city: data.city || null,
      ...(omitCpfOnEdit ? {} : { cpf: data.cpf }),
      ...(omitPhoneOnEdit ? {} : { phone: data.phone }),
      email: data.email,
      origin: selectedOrigin as StudentOrigin,
      status: selectedStatus,
      birth_date: data.birth_date ? brDateToIso(data.birth_date) : null,
      hourly_rate: hourlyRateNumber,
      classes_per_week: classesPerWeekNumber,
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
                                  // limpar cidade quando trocar de estado
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
              <Label htmlFor="cpf">CPF {!autoTeacherId && "*"}</Label>
              <Input
                id="cpf"
                type="text"
                inputMode="numeric"
                maxLength={14}
                placeholder={
                  autoTeacherId && student && isMasked(student.cpf)
                    ? student.cpf
                    : "000.000.000-00"
                }
                {...register("cpf")}
                onChange={(e) => {
                  const masked = maskCPF(e.target.value);
                  setValue("cpf", masked, { shouldValidate: true });
                }}
                disabled={isLoading || (!!autoTeacherId && !!student)}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
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
    </BaseDialog>
  );
}
