import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useForm,
  type UseFormRegister,
  type FieldErrors,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { UserWithProfile } from "@/hooks/useUsers";
import type { Enums } from "@/integrations/supabase/types";
import {
  fetchIbgeCitiesByUf,
  BrCityOption,
  BrStateCode,
} from "@/lib/br-locations";
import { removeCountryCode } from "@/lib/utils/format-phone";
import { brDateToIso } from "@/lib/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTeachers } from "@/hooks/useTeachers";
import {
  adminSchema,
  foreignStudentSchema,
  teacherSchema,
  type AdminFormData,
  type StudentFormData,
  type TeacherFormData,
  type FormData,
} from "./userFormSchemas";
import type { UserFormSubmitData } from "./userFormTypes";
import { UserFormAdminFields } from "./UserFormAdminFields";
import { UserFormTeacherFields } from "./UserFormTeacherFields";
import { UserFormStudentFields } from "./UserFormStudentFields";
import { users as usersContent, common } from "@/content";

type AppRole = Enums<"app_role">;
type StudentOrigin = Enums<"student_origin">;
type StudentStatus = Enums<"student_status">;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserWithProfile | null;
  onSubmit: (data: UserFormSubmitData) => void;
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
  const [selectedRole, setSelectedRole] = useState<AppRole>(
    (user?.role as AppRole) || "admin"
  );

  // Student state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<StudentOrigin | "">("");
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus>("ativo");
  const [selectedCountry, setSelectedCountry] = useState<string>("Brasil");
  const [selectedState, setSelectedState] = useState<string>("");
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

  useEffect(() => {
    if (selectedRole === "student" && isBrazilSelected) {
      if (!selectedState || selectedState.length !== 2) {
        setCities([]);
        return;
      }
      setIsLoadingCities(true);
      fetchIbgeCitiesByUf(selectedState as BrStateCode).then((result) => {
        setCities(result);
        setIsLoadingCities(false);
      });
    } else {
      setCities([]);
    }
  }, [selectedState, selectedRole, isBrazilSelected]);

  const resetStudentDefaults = useCallback(() => {
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
  }, [reset, setValue]);

  useEffect(() => {
    if (!open) return;
    if (user) {
      const userRole = (user.role as AppRole) || "admin";
      setSelectedRole(userRole);
      if (userRole === "admin") {
        reset({
          email: user.email,
          fullName: user.profile?.full_name || "",
          role: "admin",
        });
      } else if (userRole === "student" && user.student) {
        const s = user.student;
        reset({
          name: s.name || "",
          email: s.email || user.email,
          phone: s.phone || "",
          state: s.state || "",
          city: s.city || "",
          birth_date: s.birth_date
            ? format(new Date(s.birth_date), "dd/MM/yyyy", { locale: ptBR })
            : null,
          hourly_rate: s.hourly_rate ? String(s.hourly_rate) : "",
          pay_day: s.pay_day ? String(s.pay_day) : "",
          origin: (s.origin as StudentOrigin) || "outro",
          status: (s.status as StudentStatus) || "ativo",
          role: "student",
        });
        setSelectedOrigin((s.origin as StudentOrigin) || "outro");
        setSelectedStatus((s.status as StudentStatus) || "ativo");
        setSelectedCountry(s.country || "Brasil");
        setSelectedState(s.state || "");
        setSelectedTeacherId(s.teacher_id || "");
        setValue("country", s.country || "Brasil", { shouldValidate: false });
      } else if (userRole === "teacher" && user.teacher) {
        const t = user.teacher;
        reset({
          name: t.name || "",
          email: t.email || user.email,
          phone: t.phone || "",
          role: "teacher",
        });
      }
    } else {
      if (selectedRole === "admin")
        reset({ email: "", fullName: "", role: "admin" });
      else if (selectedRole === "student") resetStudentDefaults();
      else reset({ name: "", email: "", phone: "", role: "teacher" });
    }
  }, [user, open, reset, selectedRole, setValue, resetStudentDefaults]);

  const handleRoleChange = (value: string) => {
    const newRole = value as AppRole;
    setSelectedRole(newRole);
    setValue("role", newRole);
    if (newRole === "admin") reset({ email: "", fullName: "", role: "admin" });
    else if (newRole === "student") resetStudentDefaults();
    else reset({ name: "", email: "", phone: "", role: "teacher" });
  };

  const handleFormSubmit = (data: FormData) => {
    if (selectedRole === "admin" && "fullName" in data) {
      onSubmit({ email: data.email, fullName: data.fullName, role: "admin" });
    } else if (selectedRole === "student" && "name" in data) {
      if (!selectedTeacherId) {
        setTeacherError(common.errors.selectTeacher);
        return;
      }
      setTeacherError(null);
      const s = data as StudentFormData;
      const hourlyRateNumber = s.hourly_rate
        ? parseFloat(s.hourly_rate.replace(/[^.\d,]/g, "").replace(",", "."))
        : null;
      const normalizedPhone = s.phone
        ? removeCountryCode(s.phone, selectedCountry)
        : null;
      onSubmit({
        email: data.email,
        fullName: s.name,
        role: "student",
        studentData: {
          name: s.name,
          country: selectedCountry,
          state: isBrazilSelected ? selectedState || null : s.state || null,
          city: s.city || null,
          phone: normalizedPhone || null,
          email: data.email,
          origin: selectedOrigin as StudentOrigin,
          status: selectedStatus,
          birth_date: s.birth_date ? brDateToIso(s.birth_date) : null,
          hourly_rate: hourlyRateNumber,
          pay_day: s.pay_day ? Number(s.pay_day) : null,
          teacher_id: selectedTeacherId,
        },
      });
    } else if (selectedRole === "teacher" && "name" in data) {
      const t = data as TeacherFormData;
      const normalizedPhone =
        t.phone?.trim().length > 0
          ? removeCountryCode(t.phone, "Brasil")
          : undefined;
      onSubmit({
        email: data.email,
        fullName: t.name,
        role: "teacher",
        teacherData: {
          name: t.name,
          email: data.email,
          ...(normalizedPhone && { phone: normalizedPhone }),
        },
      });
    }
  };

  const locationProps = {
    isBrazilSelected,
    selectedCountry,
    setSelectedCountry,
    selectedState,
    setSelectedState,
    cities,
    isLoadingCities,
    countryPopoverOpen,
    setCountryPopoverOpen,
    statePopoverOpen,
    setStatePopoverOpen,
    cityPopoverOpen,
    setCityPopoverOpen,
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        user
          ? usersContent.formDialog.titleEdit
          : usersContent.formDialog.titleNew
      }
      size={selectedRole === "admin" ? "SM" : "MD"}
    >
      {!isEdit && (
        <div>
          <Label className="mb-2 block text-sm font-medium">
            Tipo de conta
          </Label>
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

        {selectedRole === "admin" && (
          <UserFormAdminFields
            register={register as UseFormRegister<AdminFormData>}
            errors={errors as FieldErrors<AdminFormData>}
            isLoading={isLoading}
            isEdit={isEdit}
          />
        )}

        {selectedRole === "student" && (
          <UserFormStudentFields
            register={register as UseFormRegister<StudentFormData>}
            errors={errors as FieldErrors<StudentFormData>}
            setValue={setValue as UseFormSetValue<StudentFormData>}
            watch={watch as UseFormWatch<StudentFormData>}
            isLoading={isLoading}
            isEdit={isEdit}
            activeTeachers={activeTeachers}
            loadingTeachers={loadingTeachers}
            selectedTeacherId={selectedTeacherId}
            setSelectedTeacherId={setSelectedTeacherId}
            teacherError={teacherError}
            setTeacherError={setTeacherError}
            selectedOrigin={selectedOrigin}
            setSelectedOrigin={setSelectedOrigin}
            {...locationProps}
          />
        )}

        {selectedRole === "teacher" && (
          <UserFormTeacherFields
            register={register as UseFormRegister<TeacherFormData>}
            errors={errors as FieldErrors<TeacherFormData>}
            setValue={setValue as UseFormSetValue<TeacherFormData>}
            isLoading={isLoading}
            isEdit={isEdit}
          />
        )}

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {common.actions.cancel}
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading || (selectedRole === "student" && !selectedOrigin)
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit
                  ? usersContent.formDialog.submitting
                  : usersContent.formDialog.submitting}
              </>
            ) : isEdit ? (
              usersContent.formDialog.submitButton
            ) : (
              usersContent.formDialog.createButton
            )}
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
