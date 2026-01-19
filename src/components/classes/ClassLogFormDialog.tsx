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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { ClassLogInsert, ClassLogWithStudent } from "@/hooks/useClassLogs";

const classLogSchema = z.object({
  student_id: z.string().min(1, "Selecione um aluno"),
  class_date: z.string().min(1, "Informe a data da aula"),
  attendance: z.boolean(),
  grade: z.string().optional(),
  feedback: z.string().max(1000, "Feedback deve ter no máximo 1000 caracteres").optional(),
});

type ClassLogFormData = z.infer<typeof classLogSchema>;

interface ClassLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classLog?: ClassLogWithStudent | null;
  onSubmit: (data: ClassLogInsert) => void;
  isLoading: boolean;
}

export function ClassLogFormDialog({
  open,
  onOpenChange,
  classLog,
  onSubmit,
  isLoading,
}: ClassLogFormDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [attendance, setAttendance] = useState(true);
  const { data: students = [], isLoading: loadingStudents } = useStudents();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassLogFormData>({
    resolver: zodResolver(classLogSchema),
    defaultValues: {
      attendance: true,
    },
  });

  useEffect(() => {
    if (open && classLog) {
      setSelectedStudentId(classLog.student_id);
      setAttendance(classLog.attendance ?? true);
      setValue("student_id", classLog.student_id);
      setValue("class_date", classLog.class_date);
      setValue("attendance", classLog.attendance ?? true);
      setValue("grade", classLog.grade?.toString() || "");
      setValue("feedback", classLog.feedback || "");
    } else if (!open) {
      reset();
      setSelectedStudentId("");
      setAttendance(true);
    }
  }, [open, classLog, reset, setValue]);

  const handleFormSubmit = (data: ClassLogFormData) => {
    let grade: number | null = null;
    if (data.grade && data.attendance) {
      const parsed = parseFloat(data.grade.replace(",", "."));
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
        grade = parsed;
      }
    }

    onSubmit({
      student_id: data.student_id,
      class_date: data.class_date,
      attendance: data.attendance,
      grade: data.attendance ? grade : null,
      feedback: data.feedback?.trim() || null,
    });
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setValue("student_id", value);
  };

  const handleAttendanceChange = (checked: boolean) => {
    setAttendance(checked);
    setValue("attendance", checked);
    if (!checked) {
      setValue("grade", "");
    }
  };

  // Filter only active students
  const activeStudents = students.filter((s) => s.status === "ativo");
  const isEditing = !!classLog;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Registro" : "Registrar Aula"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Student Select */}
          <div className="space-y-2">
            <Label>Aluno *</Label>
            <Select
              value={selectedStudentId}
              onValueChange={handleStudentChange}
              disabled={loadingStudents || isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
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
              <p className="text-sm text-destructive">{errors.student_id.message}</p>
            )}
          </div>

          {/* Class Date */}
          <div className="space-y-2">
            <Label htmlFor="class_date">Data da Aula *</Label>
            <Input
              id="class_date"
              type="date"
              {...register("class_date")}
            />
            {errors.class_date && (
              <p className="text-sm text-destructive">{errors.class_date.message}</p>
            )}
          </div>

          {/* Attendance Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="attendance">Presença</Label>
              <p className="text-sm text-muted-foreground">
                O aluno compareceu à aula?
              </p>
            </div>
            <Switch
              id="attendance"
              checked={attendance}
              onCheckedChange={handleAttendanceChange}
            />
          </div>

          {/* Grade - only show if present */}
          {attendance && (
            <div className="space-y-2">
              <Label htmlFor="grade">Nota (0 a 10)</Label>
              <Input
                id="grade"
                type="text"
                placeholder="8.5"
                {...register("grade")}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se não houver avaliação
              </p>
            </div>
          )}

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Observações sobre a aula..."
              rows={3}
              {...register("feedback")}
            />
            {errors.feedback && (
              <p className="text-sm text-destructive">{errors.feedback.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Registrar Aula"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
