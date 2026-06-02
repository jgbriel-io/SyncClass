import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Loader2 } from "lucide-react";
import { Student, StudentInsert } from "@/hooks/useStudents";
import {
  fetchIbgeCitiesByUf,
  BrCityOption,
  BrStateCode,
} from "@/lib/br-locations";
import { isMasked, maskPhone } from "@/lib/utils/patterns";
import { brDateToIso } from "@/lib/utils/formatters";
import { useTeachers } from "@/hooks/useTeachers";
import { GAP, STACK } from "@/lib/design-tokens/spacing";
import { ICON_SIZES } from "@/lib/design-tokens/icon-sizes";
import { StudentLocationSection } from "./StudentLocationSection";
import { StudentContactSection } from "./StudentContactSection";
import { StudentTeacherField } from "./StudentTeacherField";
import { StudentAdditionalFields } from "./StudentAdditionalFields";
import { students as studentsContent, common } from "@/content";
import {
  studentSchema,
  type StudentFormData,
  type StudentOrigin,
  type StudentStatus,
} from "./StudentFormDialog.schema";

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
  const [selectedOrigin, setSelectedOrigin] = useState<StudentOrigin | "">(
    student?.origin || ""
  );
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus>(
    student?.status || "ativo"
  );
  const [selectedCountry, setSelectedCountry] = useState<string>("Brasil");
  const [selectedState, setSelectedState] = useState<string>(
    student?.state || ""
  );
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
        ? student.country && student.country !== "Brasil"
          ? student.phone
          : isMasked(student.phone)
            ? student.phone
            : student.phone.includes("(")
              ? student.phone
              : maskPhone(student.phone)
        : "",
      email: student?.email || "",
      hourly_rate: student?.hourly_rate
        ? Number(student.hourly_rate).toFixed(2).replace(".", ",")
        : "",
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
      setSelectedTeacherId(autoTeacherId || "");
      setTeacherError(null);
      setValue("country", "Brasil", { shouldValidate: false });
      return;
    }

    if (student) {
      const formattedPhone = student.phone
        ? student.country && student.country !== "Brasil"
          ? student.phone
          : isMasked(student.phone)
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
        hourly_rate: student.hourly_rate
          ? Number(student.hourly_rate).toFixed(2).replace(".", ",")
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
      setSelectedTeacherId(student.teacher_id || "");
      setValue("country", student.country || "Brasil", {
        shouldValidate: false,
      });
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
      setTeacherError(studentsContent.validation.teacherRequired);
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
      state: isBrazilSelected ? selectedState || null : data.state || null,
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
      title={
        student
          ? studentsContent.formDialog.titleEdit
          : studentsContent.formDialog.titleNew
      }
      size="MD"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className={STACK.DEFAULT}>
        <div className={`grid ${GAP.DEFAULT} sm:grid-cols-2`}>
          {/* Professor (só ao criar) */}
          {!student && (
            <StudentTeacherField
              isLoading={isLoading}
              loadingTeachers={loadingTeachers}
              autoTeacherId={autoTeacherId}
              activeTeachers={activeTeachers}
              selectedTeacherId={selectedTeacherId}
              teacherError={teacherError}
              onTeacherChange={(value) => {
                setSelectedTeacherId(value);
                setTeacherError(null);
              }}
            />
          )}

          {/* Nome */}
          <div className={`sm:col-span-2 ${STACK.TIGHT}`}>
            <Label htmlFor="name">{studentsContent.formDialog.nameLabel}</Label>
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

          <StudentAdditionalFields
            register={register}
            setValue={setValue}
            errors={errors}
            isLoading={isLoading}
            selectedOrigin={selectedOrigin}
            onOriginChange={(origin) => {
              setSelectedOrigin(origin);
              setValue("origin", origin, { shouldValidate: true });
            }}
          />
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
