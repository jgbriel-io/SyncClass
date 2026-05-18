import { useState, useEffect } from "react";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers, Teacher } from "@/hooks/useTeachers";
import { usePackageClassesForm } from "@/hooks/usePackageClassesForm";
import { PackageSlotList, type Slot, type ScheduleMode } from "./PackageSlotList";
import { PackageFinancialSection } from "./PackageFinancialSection";
import { classes as classesContent, common } from "@/content";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PackageClassesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId?: string;
  enableTeacherSelection?: boolean;
  /** Aluno já selecionado (ex.: vindo do perfil do aluno) */
  initialStudentId?: string | null;
  onSuccess?: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PackageClassesDialog({
  open,
  onOpenChange,
  teacherId,
  enableTeacherSelection = true,
  initialStudentId,
  onSuccess,
}: PackageClassesDialogProps) {
  const [studentId, setStudentId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherId || "");
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [semCobranca, setSemCobranca] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("fixed");
  const [fixedMonth, setFixedMonth] = useState<number>(0);
  const [fixedYear, setFixedYear] = useState<number>(2026);
  const [fixedWeekdays, setFixedWeekdays] = useState<number[]>([]);
  const [fixedStartTime, setFixedStartTime] = useState("");
  const [fixedEndTime, setFixedEndTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([{ ...emptySlot }]);

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const activeStudents = students.filter((s) => s.status === "ativo");
  const selectedStudent = activeStudents.find((s) => s.id === studentId);

  const { submit: handleSubmit, isPending } = usePackageClassesForm({
    slots,
    studentId,
    selectedTeacherId,
    selectedStudent: selectedStudent ?? null,
    semCobranca,
    paymentMethod,
    enableTeacherSelection: enableTeacherSelection ?? false,
    teacherId,
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  const resetForm = () => {
    setStudentId("");
    setSelectedTeacherId(teacherId ?? "");
    setSlots([{ ...emptySlot }]);
    setSemCobranca(false);
    setPaymentMethod("");
    setScheduleMode("fixed");
    setFixedMonth(0);
    setFixedYear(2026);
    setFixedWeekdays([]);
    setFixedStartTime("");
    setFixedEndTime("");
    setTeacherError(null);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open, teacherId]);

  useEffect(() => {
    if (open) {
      resetForm();
      setStudentId(initialStudentId ?? "");
      setSelectedTeacherId(teacherId ?? "");
    }
  }, [open, initialStudentId, teacherId]);

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={classesContent.packageDialog.title}
      size="MD"
      scrollable={true}
    >
      <div className="space-y-4">
        {/* Professor */}
        {enableTeacherSelection && (
          <div className="space-y-2">
            <Label>{classesContent.packageDialog.teacherLabel}</Label>
            <Select
              value={selectedTeacherId}
              onValueChange={(v) => {
                setSelectedTeacherId(v);
                setTeacherError(null);
              }}
              disabled={loadingTeachers}
            >
              <SelectTrigger>
                <SelectValue placeholder={classesContent.packageDialog.teacherPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t: Teacher) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teacherError && <p className="text-sm text-destructive">{teacherError}</p>}
          </div>
        )}

        {/* Aluno */}
        <div className="space-y-2">
          <Label>{classesContent.packageDialog.studentLabel}</Label>
          <Select value={studentId} onValueChange={setStudentId} disabled={loadingStudents}>
            <SelectTrigger>
              <SelectValue placeholder={classesContent.packageDialog.studentPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {activeStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sem cobrança */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="pkg-semCobranca"
            checked={semCobranca}
            onCheckedChange={(c) => setSemCobranca(!!c)}
          />
          <Label htmlFor="pkg-semCobranca" className="cursor-pointer font-normal">
            {classesContent.packageDialog.noCharge}
          </Label>
        </div>

        {/* Slots */}
        <PackageSlotList
          slots={slots}
          scheduleMode={scheduleMode}
          fixedMonth={fixedMonth}
          fixedYear={fixedYear}
          fixedWeekdays={fixedWeekdays}
          fixedStartTime={fixedStartTime}
          fixedEndTime={fixedEndTime}
          onSlotsChange={setSlots}
          onScheduleModeChange={setScheduleMode}
          onFixedMonthChange={setFixedMonth}
          onFixedYearChange={setFixedYear}
          onFixedWeekdaysChange={setFixedWeekdays}
          onFixedStartTimeChange={setFixedStartTime}
          onFixedEndTimeChange={setFixedEndTime}
        />

        {/* Financeiro */}
        {!semCobranca && selectedStudent && (
          <PackageFinancialSection
            slots={slots}
            hourlyRate={selectedStudent.hourly_rate ?? null}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
          />
        )}

        {/* Ações */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {classesContent.packageDialog.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {classesContent.packageDialog.submitting}
              </>
            ) : (
              classesContent.packageDialog.submitButton(slots.length)
            )}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
