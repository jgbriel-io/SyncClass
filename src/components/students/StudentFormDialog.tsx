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
import { fetchIbgeCitiesByUf, BrCityOption, BrStateCode } from "@/lib/br-locations";
import { isValidDateString, isMasked, maskPhone } from "@/lib/utils/patterns";
import { useTeachers } from "@/hooks/useTeachers";
import { GAP, STACK, ICON_SIZES } from "@/lib/design-tokens";
import { emailSchema } from "@/lib/validation/email";
import { StudentLocationSection } from "./StudentLocationSection";
import { StudentContactSection } from "./StudentContactSection";
import { students as studentsContent, common } from "@/content";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StudentOrigin = Enums<"student_origin">;
type StudentStatus = Enums<"student_status">;

function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const studentSchema = z.object({
  name: z.string().min(2, studentsContent.validation.nameMin).max(100),
  email: emailSchema,
  hourly_rate: z.string().optional().nullable(),
  pay_day: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !isNaN(num) && num >= 1 && num <= 31;
      },
      { message: studentsContent.validation.payDayRange }
    ),
  origin: z.enum(["indicacao", "google", "instagram", "passante", "outro"]),
  status: z.enum(["ativo", "inativo"]).optional(),
  birth_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || isValidDateString(val), { message: studentsContent.validation.birthDateInvalid }),
  country: z.string().min(2, studentsContent.validation.countryRequired).max(100),
  state: z.string().min(1, studentsContent.validation.stateRequired).max(100),
  city: z.string().min(1, studentsContent.validation.cityRequired).max(100),
  phone: z
    .string()
    .min(1, studentsContent.validation.phoneRequired)
    .refine(
      (v) => {
        const digitsOnly = v.replace(/\D/g, "");
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
      },
      studentsContent.validation.phoneDigits
    ),
});

type StudentFormData = z.infer<typeof studentSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSubmit: (data: StudentInsert) => void;
  isLoading?: boolean;
  autoTeacherId?: string | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSubmit,
  isLoading,
  autoTeacherId,
}: StudentFormDialogProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<StudentOrigin | "">(student?.origin || "");
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus>(student?.status || "ativo");
  const [selectedCountry, setSelectedCountry] = useState<string>("Brasil");
  const [selectedState, setSelectedState] = useState<string>(student?.state || "");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [cities, setCities] = useState<BrCityOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const activeTeachers = teachers.filter((t) => t.status === "ativo");

  const isBrazilSelected =
    selectedCountry.toLowerCase() === "brasil" ||
    selectedCountry.toLowerCase() === "brazil";

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<StudentFormData>({
      resolver: zodResolver(studentSchema),
      defaultValues: {
        name: student?.name || "",
        country: student?.country || "Brasil",
        state: student?.state || "",
        city: student?.city || "",
        phone: student?.phone
          ? isMasked(student.phone)
            ? student.phone
            : student.phone.includes("(")
            ? student.phone
            : maskPhone(student.phone)
          : "",
        email: student?.email || "",
        hourly_rate: student?.hourly_rate ? String(student.hourly_rate).replace(".", ",") : "",
        pay_day: student?.pay_day ? String(student.pay_day) : "",
        origin: student?.origin || undefined,
        status: student?.status || "ativo",
        birth_date: student?.birth_date
          ? format(new Date(student.birth_date + "T00:00:00"), "dd/MM/yyyy")
          : null,
      },
    });

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      reset({
        name: "", country: "Brasil", state: "", city: "", phone: "",
        email: "", hourly_rate: "", pay_day: "", origin: undefined,
        status: "ativo", birth_date: null,
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedCountry("Brasil");
      setSelectedState("");
      setSelectedTeacherId(autoTeacherId || "");
      setTeacherError(null);
      setValue("country", "Brasil", { shouldValidate: false });
      return;
    }

    if (student) {
      const formattedPhone = student.phone
        ? isMasked(student.phone)
          ? student.phone
          : student.phone.includes("(")
          ? student.phone
          : maskPhone(student.phone)
        : "";
      reset({
        name: student.name,
        country: student.country || "Brasil",
        state: student.state || "",
        city: student.city || "",
        phone: formattedPhone,
        email: student.email || "",
        hourly_rate: student.hourly_rate ? String(student.hourly_rate).replace(".", ",") : "",
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
      setSelectedTeacherId(student.teacher_id || "");
      setValue("country", student.country || "Brasil", { shouldValidate: false });
    } else {
      reset({
        name: "", country: "Brasil", state: "", city: "", phone: "",
        email: "", hourly_rate: "", pay_day: "", origin: undefined,
        status: "ativo", birth_date: null,
      });
      setSelectedOrigin("");
      setSelectedStatus("ativo");
      setSelectedCountry("Brasil");
      setSelectedState("");
      setSelectedTeacherId(autoTeacherId || "");
      setTeacherError(null);
      setValue("country", "Brasil", { shouldValidate: false });
    }
  }, [student, open, reset, setValue, autoTeacherId]);

  // Carregar cidades do IBGE quando estado muda
  useEffect(() => {
    if (!isBrazilSelected) {
      setCities([]);
      return;
    }
    if (!selectedState || selectedState.length !== 2) {
      setCities([]);
      return;
    }
    setIsLoadingCities(true);
    fetchIbgeCitiesByUf(selectedState as BrStateCode).then((result) => {
      setCities(result);
      setIsLoadingCities(false);
    });
  }, [selectedState, isBrazilSelected]);

  const handleFormSubmit = (data: StudentFormData) => {
    if (!student && !selectedTeacherId) {
      setTeacherError("Selecione um professor");
      return;
    }
    setTeacherError(null);

    const hourlyRateNumber = data.hourly_rate
      ? parseFloat(data.hourly_rate.replace(/[^.\d,]/g, "").replace(",", "."))
      : null;
    const payDayNumber = data.pay_day ? Number(data.pay_day) : null;
    const omitPhoneOnEdit = student && data.phone.trim() === "";
    const normalizedPhone = data.phone
      ? isBrazilSelected
        ? data.phone.replace(/\D/g, "")
        : data.phone.trim()
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
      teacher_id: !student ? selectedTeacherId : undefined,
    };

    onSubmit(submitData);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={student ? studentsContent.formDialog.titleEdit : studentsContent.formDialog.titleNew}
      size="MD"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className={STACK.DEFAULT}>
        <div className={`grid ${GAP.DEFAULT} sm:grid-cols-2`}>
          {/* Professor (só ao criar) */}
          {!student && (
            <div className={`sm:col-span-2 ${STACK.TIGHT}`}>
              <Label htmlFor="teacher">Professor *</Label>
              <Select
                value={selectedTeacherId}
                onValueChange={(value) => {
                  setSelectedTeacherId(value);
                  setTeacherError(null);
                }}
                disabled={isLoading || loadingTeachers || !!autoTeacherId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  {activeTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teacherError && (
                <p className="text-sm text-destructive">{teacherError}</p>
              )}
            </div>
          )}

          {/* Nome */}
          <div className={`sm:col-span-2 ${STACK.TIGHT}`}>
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              placeholder={studentsContent.formDialog.namePlaceholder}
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Localização */}
          <StudentLocationSection
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            isLoading={isLoading}
            selectedCountry={selectedCountry}
            selectedState={selectedState}
            isBrazilSelected={isBrazilSelected}
            cities={cities}
            isLoadingCities={isLoadingCities}
            cityPopoverOpen={cityPopoverOpen}
            statePopoverOpen={statePopoverOpen}
            countryPopoverOpen={countryPopoverOpen}
            onCountryChange={setSelectedCountry}
            onStateChange={setSelectedState}
            onCityPopoverChange={setCityPopoverOpen}
            onStatePopoverChange={setStatePopoverOpen}
            onCountryPopoverChange={setCountryPopoverOpen}
          />

          {/* Contato */}
          <StudentContactSection
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            isLoading={isLoading}
            isBrazilSelected={isBrazilSelected}
          />

          {/* Valor por hora */}
          <div className={STACK.TIGHT}>
            <Label htmlFor="hourly_rate_valor">Valor por hora</Label>
            <Input
              id="hourly_rate_valor"
              type="text"
              placeholder="Ex: 120,00"
              {...register("hourly_rate")}
              disabled={isLoading}
            />
          </div>

          {/* Dia de pagamento */}
          <div className={STACK.TIGHT}>
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

          {/* Origem */}
          <div className={STACK.TIGHT}>
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

        <div className={`flex justify-end ${GAP.DEFAULT} pt-4`}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {common.actions.cancel}
          </Button>
          <Button type="submit" disabled={isLoading || !selectedOrigin}>
            {isLoading ? (
              <>
                <Loader2 className={`mr-2 ${ICON_SIZES.SM} animate-spin`} />
                {studentsContent.formDialog.submitting}
              </>
            ) : student ? (
              studentsContent.formDialog.submitButton
            ) : (
              studentsContent.formDialog.createButton
            )}
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
