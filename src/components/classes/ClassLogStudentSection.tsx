import {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  FieldValues,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { brDateStringToDate, REGEX_PATTERNS } from "@/lib/utils/patterns";
import { brDateToIso } from "@/lib/utils/classFormHelpers";
import type { Teacher } from "@/hooks/useTeachers";
import { classes as classesContent, common } from "@/content";

type Student = { id: string; name: string; status: string };

interface ClassLogStudentSectionProps {
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  errors: FieldErrors<FieldValues>;
  isEditing: boolean;
  enableTeacherSelection?: boolean;
  selectedStudentId: string;
  selectedTeacherId: string;
  teacherError: string | null;
  activeStudents: Student[];
  teachers: Teacher[];
  loadingStudents: boolean;
  loadingTeachers: boolean;
  effectiveDurationMinutes: number | null;
  onStudentChange: (value: string) => void;
  onTeacherChange: (value: string) => void;
}

export function ClassLogStudentSection({
  register,
  setValue,
  watch,
  errors,
  isEditing,
  enableTeacherSelection,
  selectedStudentId,
  selectedTeacherId,
  teacherError,
  activeStudents,
  teachers,
  loadingStudents,
  loadingTeachers,
  effectiveDurationMinutes,
  onStudentChange,
  onTeacherChange,
}: ClassLogStudentSectionProps) {
  const classDate = watch("class_date");
  const selectedTeacherName = teachers.find(
    (t) => t.id === selectedTeacherId
  )?.name;

  return (
    <>
      {/* Professor (só quando habilitado — admin) */}
      {enableTeacherSelection && (
        <div className="space-y-2">
          <Label>{common.labels.teacher} *</Label>
          {isEditing && selectedTeacherId ? (
            <>
              <Input
                value={selectedTeacherName || common.labels.teacherNotFound}
                disabled
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                {common.hints.teacherCannotChange}
              </p>
            </>
          ) : (
            <>
              <Select
                value={selectedTeacherId}
                onValueChange={onTeacherChange}
                disabled={loadingTeachers}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={common.placeholders.selectTeacher}
                  />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teacherError && (
                <p className="text-sm text-destructive">{teacherError}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Aluno */}
      <div className="space-y-2">
        <Label>{common.labels.student} *</Label>
        <Select
          value={selectedStudentId}
          onValueChange={onStudentChange}
          disabled={loadingStudents || isEditing}
        >
          <SelectTrigger>
            <SelectValue placeholder={common.placeholders.selectStudent} />
          </SelectTrigger>
          <SelectContent>
            {activeStudents.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" {...register("student_id")} />
        {errors.student_id && (
          <p className="text-sm text-destructive">
            {String(errors.student_id.message)}
          </p>
        )}
      </div>

      {/* Título da Aula */}
      <div className="space-y-2">
        <Label htmlFor="title">
          {classesContent.logFormDialog.titleFieldLabel}
        </Label>
        <Input
          id="title"
          type="text"
          placeholder={common.placeholders.classTopicHint}
          {...register("title")}
        />
      </div>

      {/* Data da Aula */}
      <div className="space-y-2">
        <Label htmlFor="class_date">
          {classesContent.logFormDialog.dateLabel}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="class_date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-10 overflow-hidden",
                !classDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {classDate || classesContent.logFormDialog.datePlaceholder}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={brDateStringToDate(classDate || "") ?? undefined}
              onSelect={(date) => {
                if (date) {
                  setValue(
                    "class_date",
                    format(date, "dd/MM/yyyy", { locale: ptBR }),
                    {
                      shouldValidate: true,
                    }
                  );
                }
              }}
              locale={ptBR}
              initialFocus
              disabled={(date) => {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                return d.getFullYear() < 2026;
              }}
            />
          </PopoverContent>
        </Popover>
        {errors.class_date && (
          <p className="text-sm text-destructive">
            {String(errors.class_date.message)}
          </p>
        )}
      </div>

      {/* Horário */}
      <div className="space-y-3 rounded-lg border p-3">
        <p className="text-sm font-medium">
          {classesContent.logFormDialog.titleFieldLabel}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="start_time">
              {classesContent.logFormDialog.startTimeLabel}
            </Label>
            <Input id="start_time" type="time" {...register("start_time")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end_time">
              {classesContent.logFormDialog.endTimeLabel}
            </Label>
            <Input id="end_time" type="time" {...register("end_time")} />
            {errors.end_time && (
              <p className="text-xs text-destructive">
                {String(errors.end_time.message)}
              </p>
            )}
          </div>
        </div>
        {effectiveDurationMinutes != null && (
          <p className="text-xs text-muted-foreground">
            {classesContent.logFormDialog.titleFieldLabel}:{" "}
            {effectiveDurationMinutes} min
          </p>
        )}
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observations">
          {classesContent.logFormDialog.observationsLabel}
        </Label>
        <Textarea
          id="observations"
          placeholder={common.placeholders.preClassNotesHint}
          rows={2}
          {...register("observations")}
        />
        {errors.observations && (
          <p className="text-sm text-destructive">
            {String(errors.observations.message)}
          </p>
        )}
      </div>
    </>
  );
}
