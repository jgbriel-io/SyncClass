import { type UseFormRegister, type FieldErrors, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { maskPhone, brDateStringToDate } from "@/lib/utils/patterns";
import { useDateMask } from "@/hooks/useDateMask";
import { UserFormStudentLocationFields } from "./UserFormStudentLocationFields";
import type { BrCityOption } from "@/lib/br-locations";
import type { Enums } from "@/integrations/supabase/types";
import type { Teacher } from "@/hooks/useTeachers";

type StudentOrigin = Enums<"student_origin">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormData = any;

interface UserFormStudentFieldsProps {
  register: UseFormRegister<AnyFormData>;
  errors: FieldErrors<AnyFormData>;
  setValue: UseFormSetValue<AnyFormData>;
  watch: UseFormWatch<AnyFormData>;
  isLoading: boolean;
  isEdit: boolean;
  // Teacher
  activeTeachers: Teacher[];
  loadingTeachers: boolean;
  selectedTeacherId: string;
  setSelectedTeacherId: (v: string) => void;
  teacherError: string | null;
  setTeacherError: (v: string | null) => void;
  // Origin
  selectedOrigin: StudentOrigin | "";
  setSelectedOrigin: (v: StudentOrigin | "") => void;
  // Location
  isBrazilSelected: boolean;
  selectedCountry: string;
  setSelectedCountry: (v: string) => void;
  selectedState: string;
  setSelectedState: (v: string) => void;
  cities: BrCityOption[];
  isLoadingCities: boolean;
  countryPopoverOpen: boolean;
  setCountryPopoverOpen: (v: boolean) => void;
  statePopoverOpen: boolean;
  setStatePopoverOpen: (v: boolean) => void;
  cityPopoverOpen: boolean;
  setCityPopoverOpen: (v: boolean) => void;
}

export function UserFormStudentFields({
  register, errors, setValue, watch, isLoading, isEdit,
  activeTeachers, loadingTeachers, selectedTeacherId, setSelectedTeacherId, teacherError, setTeacherError,
  selectedOrigin, setSelectedOrigin,
  isBrazilSelected, selectedCountry, setSelectedCountry, selectedState, setSelectedState,
  cities, isLoadingCities,
  countryPopoverOpen, setCountryPopoverOpen,
  statePopoverOpen, setStatePopoverOpen,
  cityPopoverOpen, setCityPopoverOpen,
}: UserFormStudentFieldsProps) {
  const watchedCity = watch("city") || "";
  const birthDate = watch("birth_date");
  const { handleChange: handleDateChange, handleKeyDown: handleDateKeyDown } = useDateMask(
    (value, options) => setValue("birth_date", value, options)
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Professor */}
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="teacher">Professor *</Label>
        <Select value={selectedTeacherId} onValueChange={(v) => { setSelectedTeacherId(v); setTeacherError(null); }} disabled={isLoading || loadingTeachers}>
          <SelectTrigger><SelectValue placeholder="Selecione um professor" /></SelectTrigger>
          <SelectContent>
            {activeTeachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {teacherError && <p className="text-sm text-destructive">{teacherError}</p>}
      </div>

      {/* Nome */}
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="name">Nome completo *</Label>
        <Input id="name" placeholder="Nome do aluno" {...register("name")} disabled={isLoading} />
        {errors.name && <p className="text-sm text-destructive">{errors.name?.message}</p>}
      </div>

      {/* Localização */}
      <UserFormStudentLocationFields
        register={register} errors={errors} setValue={setValue} isLoading={isLoading}
        isBrazilSelected={isBrazilSelected} selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
        selectedState={selectedState} setSelectedState={setSelectedState}
        cities={cities} isLoadingCities={isLoadingCities} watchedCity={watchedCity}
        countryPopoverOpen={countryPopoverOpen} setCountryPopoverOpen={setCountryPopoverOpen}
        statePopoverOpen={statePopoverOpen} setStatePopoverOpen={setStatePopoverOpen}
        cityPopoverOpen={cityPopoverOpen} setCityPopoverOpen={setCityPopoverOpen}
      />

      {/* Data de Nascimento */}
      <div className="space-y-2">
        <Label htmlFor="birth_date">Data de Nascimento *</Label>
        <div className="flex gap-2">
          <Input id="birth_date" type="text" placeholder="dd/mm/aaaa" maxLength={10} value={birthDate || ""} onChange={handleDateChange} onKeyDown={handleDateKeyDown} disabled={isLoading} className="flex-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="shrink-0" disabled={isLoading}>
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
                  <SelectTrigger className="w-full"><SelectValue placeholder="Ano" /></SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Calendar
                mode="single"
                selected={brDateStringToDate(birthDate || "") ?? undefined}
                onSelect={(date) => { if (date) setValue("birth_date", format(date, "dd/MM/yyyy", { locale: ptBR }), { shouldValidate: true }); }}
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
        {errors.birth_date && <p className="text-sm text-destructive">{errors.birth_date?.message}</p>}
      </div>

      {/* Telefone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone *</Label>
        <Input
          id="phone" type="text"
          inputMode={isBrazilSelected ? "numeric" : "text"}
          maxLength={isBrazilSelected ? 15 : 20}
          placeholder={isBrazilSelected ? "(00) 00000-0000" : "Ex: 555 123 4567"}
          {...register("phone")}
          onChange={(e) => {
            if (isBrazilSelected) {
              setValue("phone", maskPhone(e.target.value), { shouldValidate: true });
            } else {
              setValue("phone", e.target.value, { shouldValidate: true });
            }
          }}
          disabled={isLoading}
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone?.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" placeholder="email@exemplo.com" {...register("email")} disabled={isLoading || isEdit} />
        {errors.email && <p className="text-sm text-destructive">{errors.email?.message}</p>}
      </div>

      {/* Valor por hora */}
      <div className="space-y-2">
        <Label htmlFor="hourly_rate">Valor por hora *</Label>
        <Input id="hourly_rate_valor" type="text" placeholder="Ex: 120,00" {...register("hourly_rate")} disabled={isLoading} />
        {errors.hourly_rate && <p className="text-sm text-destructive">{errors.hourly_rate?.message}</p>}
      </div>

      {/* Dia de pagamento */}
      <div className="space-y-2">
        <Label htmlFor="pay_day">Dia de pagamento *</Label>
        <Input id="pay_day" type="number" min={1} max={31} placeholder="1 a 31" {...register("pay_day")} disabled={isLoading} />
        {errors.pay_day && <p className="text-sm text-destructive">{errors.pay_day?.message}</p>}
      </div>

      {/* Origem */}
      <div className="space-y-2">
        <Label>Origem do Aluno *</Label>
        <Select value={selectedOrigin} onValueChange={(v) => { setSelectedOrigin(v as StudentOrigin); setValue("origin", v, { shouldValidate: true }); }} disabled={isLoading}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="indicacao">Indicação</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="passante">Passante</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
        {errors.origin && <p className="text-sm text-destructive">{errors.origin?.message}</p>}
      </div>
    </div>
  );
}
