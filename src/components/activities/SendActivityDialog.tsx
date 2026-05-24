import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Upload, CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";
import { useStudents } from "@/hooks/useStudents";
import {
  dueDateAndTimeToIso,
  activitySchema,
  type ActivityFormData,
} from "./SendActivityDialog.schema";
import { useTeachers } from "@/hooks/useTeachers";
import { useAuth } from "@/contexts/AuthContext";
import { validateFile, checkUploadRateLimit } from "@/lib/utils/fileValidation";
import {
  useCreateActivity,
  uploadActivityFile,
  useActivityFilesForTeacher,
  useAllActivityFiles,
  ActivityInsert,
} from "@/hooks/useActivities";
import { toast } from "sonner";
import { ActivityFileSourceField } from "./ActivityFileSourceField";
import { activities as activitiesContent, common } from "@/content";

interface SendActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId?: string | null; // Opcional para modo admin
  isAdmin?: boolean; // Indica se é modo admin
}

export function SendActivityDialog({
  open,
  onOpenChange,
  teacherId = null,
  isAdmin = false,
}: SendActivityDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const { user } = useAuth();

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [] } = useTeachers();

  // Para admin sem professor selecionado: busca arquivos de todos os professores
  // Para admin com professor selecionado: busca arquivos daquele professor
  // Para professor: busca seus próprios arquivos
  const effectiveTeacherId = isAdmin ? selectedTeacherId : teacherId;
  const shouldFetchAll = isAdmin && !selectedTeacherId;

  const { data: teacherFiles = [], isLoading: loadingTeacherFiles } =
    useActivityFilesForTeacher(
      shouldFetchAll ? undefined : effectiveTeacherId || undefined
    );
  const { data: allFiles = [], isLoading: loadingAllFiles } =
    useAllActivityFiles();

  const existingFiles = shouldFetchAll ? allFiles : teacherFiles;
  const loadingFiles = shouldFetchAll ? loadingAllFiles : loadingTeacherFiles;

  const createActivity = useCreateActivity();
  const activeStudents = students.filter((s) => s.status === "ativo");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      fileSource: "new",
      due_date: format(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        "dd/MM/yyyy",
        { locale: ptBR }
      ),
      due_time: "23:59",
    },
  });

  // Limpar formulário quando o modal fecha
  useEffect(() => {
    if (!open) {
      reset({
        fileSource: "new",
        due_date: format(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          "dd/MM/yyyy",
          { locale: ptBR }
        ),
        due_time: "23:59",
      });
      setSelectedFile(null);
      setSelectedTeacherId("");
    }
  }, [open, reset]);

  const fileSource = watch("fileSource");
  const dueDate = watch("due_date");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho do arquivo
    const validation = validateFile(file, "ACTIVITY_ALL");
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = ""; // Limpar input
      return;
    }

    setSelectedFile(file);
    setValue("file", file);
    setValue("existingFileUrl", undefined);
  };

  const handleFormSubmit = async (data: ActivityFormData) => {
    // Validar professor no modo admin
    if (isAdmin && !selectedTeacherId) {
      toast.error(activitiesContent.sendDialog.teacherRequired);
      return;
    }

    if (user?.id) {
      const rateLimit = checkUploadRateLimit(user.id, 10, 60000);
      if (!rateLimit.allowed) {
        toast.error(
          activitiesContent.sendDialog.toasts.rateLimitExceeded(
            rateLimit.retryAfter ?? 0
          )
        );
        return;
      }
    }

    setIsUploading(true);
    try {
      let file_url: string;
      let file_name: string;
      let file_type: string | null = null;
      let file_size: number | null = null;

      if (data.fileSource === "new" && data.file) {
        const uploaded = await uploadActivityFile(data.file);
        file_url = uploaded.url;
        file_name = data.file.name;
        file_type = data.file.type;
        file_size = data.file.size;
      } else if (data.fileSource === "existing" && data.existingFileUrl) {
        const existing = existingFiles.find(
          (f) => f.file_url === data.existingFileUrl
        );
        if (!existing) {
          toast.error(activitiesContent.sendDialog.toasts.fileNotFound);
          return;
        }
        file_url = existing.file_url;
        file_name = existing.file_name;
        file_type = existing.file_type;
        file_size = existing.file_size;
      } else {
        toast.error(activitiesContent.sendDialog.toasts.fileRequired);
        return;
      }

      const activityData: ActivityInsert = {
        student_id: data.student_id,
        teacher_id: isAdmin ? data.teacher_id || selectedTeacherId : teacherId!,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        due_date: dueDateAndTimeToIso(data.due_date, data.due_time),
        file_url,
        file_name,
        file_type,
        file_size,
        status: "enviada",
      };

      await createActivity.mutateAsync(activityData);

      reset({
        fileSource: "new",
        due_date: format(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          "dd/MM/yyyy",
          { locale: ptBR }
        ),
        due_time: "23:59",
      });
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        activitiesContent.sendDialog.toasts.error((error as Error).message)
      );
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = isUploading || createActivity.isPending;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={activitiesContent.sendDialog.title}
      description={activitiesContent.sendDialog.description}
      size="SM"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Seleção de Professor (apenas para admin) */}
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="teacher_id">
              {activitiesContent.sendDialog.teacherLabel}
            </Label>
            <Select
              value={selectedTeacherId}
              onValueChange={(value) => {
                setSelectedTeacherId(value);
                setValue("teacher_id", value);
              }}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={activitiesContent.sendDialog.teacherPlaceholder}
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
            {!selectedTeacherId && (
              <p className="text-sm text-destructive">
                {common.errors.selectTeacher}
              </p>
            )}
          </div>
        )}

        {/* Seleção de Aluno */}
        <div className="space-y-2">
          <Label htmlFor="student_id">
            {activitiesContent.sendDialog.studentLabel}
          </Label>
          <Select
            onValueChange={(value) => setValue("student_id", value)}
            disabled={loadingStudents || isPending}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={activitiesContent.sendDialog.studentPlaceholder}
              />
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
              {errors.student_id.message}
            </p>
          )}
        </div>

        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title">
            {activitiesContent.sendDialog.titleLabel}
          </Label>
          <Input
            id="title"
            placeholder={activitiesContent.sendDialog.titlePlaceholder}
            {...register("title")}
            disabled={isPending}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Prazo de entrega (data e hora) */}
        <div className="space-y-2">
          <Label>{activitiesContent.sendDialog.dueDateLabel}</Label>
          <p className="text-xs text-muted-foreground">
            {activitiesContent.sendDialog.dueDateHint}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="due_date"
                  variant="outline"
                  className="w-full sm:flex-1 justify-start text-left font-normal"
                  disabled={isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate || activitiesContent.sendDialog.dueDatePlaceholder}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    dueDate && REGEX_PATTERNS.date.test(dueDate)
                      ? (() => {
                          const [d, m, y] = dueDate.split("/");
                          return new Date(
                            parseInt(y, 10),
                            parseInt(m, 10) - 1,
                            parseInt(d, 10)
                          );
                        })()
                      : undefined
                  }
                  onSelect={(date) => {
                    if (date)
                      setValue(
                        "due_date",
                        format(date, "dd/MM/yyyy", { locale: ptBR }),
                        { shouldValidate: true }
                      );
                  }}
                  locale={ptBR}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </PopoverContent>
            </Popover>
            <Input
              id="due_time"
              type="time"
              {...register("due_time")}
              disabled={isPending}
              className="w-full sm:w-[120px]"
            />
          </div>
          {errors.due_date && (
            <p className="text-sm text-destructive">
              {errors.due_date.message}
            </p>
          )}
          {errors.due_time && (
            <p className="text-sm text-destructive">
              {errors.due_time.message}
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {common.labels.description} {common.labels.optional}
          </Label>
          <Textarea
            id="description"
            placeholder={common.placeholders.instructionsHint}
            rows={3}
            {...register("description")}
            disabled={isPending}
          />
        </div>

        {/* Arquivo: novo ou da plataforma */}
        <ActivityFileSourceField
          fileSource={fileSource}
          selectedFile={selectedFile}
          existingFileUrl={watch("existingFileUrl")}
          existingFiles={existingFiles}
          isPending={isPending}
          loadingFiles={loadingFiles}
          onFileSourceChange={(source) => {
            setValue("fileSource", source);
            setSelectedFile(null);
            setValue("file", undefined);
            setValue("existingFileUrl", undefined);
          }}
          onFileChange={handleFileChange}
          onExistingFileChange={(url) => setValue("existingFileUrl", url)}
          errorMessage={errors.file?.message ?? errors.existingFileUrl?.message}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {common.actions.cancel}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {activitiesContent.sendDialog.submitting}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {activitiesContent.sendDialog.submitButton}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </BaseDialog>
  );
}
