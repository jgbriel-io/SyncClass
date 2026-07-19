import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CircleNotch as Loader2,
  Upload,
  Calendar as CalendarIcon,
  Pencil,
} from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";
import {
  useUpdateActivity,
  uploadActivityFile,
  useActivityFilesForTeacher,
  type ActivityWithRelations,
} from "@/hooks/useActivities";
import { toast } from "sonner";
import { ActivityFileSourceField } from "./ActivityFileSourceField";
import { activities as activitiesContent, common } from "@/content";

function dueDateAndTimeToIso(dueDate: string, dueTime: string): string {
  const [day, month, year] = dueDate.split("/").map(Number);
  const [hour, minute] = dueTime.split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  return local.toISOString();
}

function parseDueDateForForm(dueDate: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!dueDate) {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      date: format(d, "dd/MM/yyyy", { locale: ptBR }),
      time: "23:59",
    };
  }
  if (dueDate.includes("T")) {
    const d = new Date(dueDate);
    return {
      date: format(d, "dd/MM/yyyy", { locale: ptBR }),
      time: format(d, "HH:mm", { locale: ptBR }),
    };
  }
  const [y, m, d] = dueDate.split("-");
  return {
    date: `${d}/${m}/${y}`,
    time: "23:59",
  };
}

const editActivitySchema = z
  .object({
    title: z.string().min(1, activitiesContent.validation.titleRequired),
    description: z.string().optional(),
    due_date: z
      .string()
      .min(1, activitiesContent.validation.dueDateRequired)
      .regex(REGEX_PATTERNS.date, activitiesContent.validation.dueDateFormat),
    due_time: z
      .string()
      .regex(
        /^([01]?\d|2[0-3]):[0-5]\d$/,
        activitiesContent.validation.dueTimeFormat
      ),
    fileSource: z.enum(["current", "new", "existing"]),
    file: z.instanceof(File).optional(),
    existingFileUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fileSource === "new") return data.file != null;
      if (data.fileSource === "existing") return !!data.existingFileUrl;
      return true;
    },
    { message: activitiesContent.validation.fileRequired, path: ["file"] }
  );

type EditActivityFormData = z.infer<typeof editActivitySchema>;

interface EditActivityDialogProps {
  activity: ActivityWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
}

export function EditActivityDialog({
  activity,
  open,
  onOpenChange,
  teacherId,
}: EditActivityDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: existingFiles = [], isLoading: loadingFiles } =
    useActivityFilesForTeacher(teacherId);
  const updateActivity = useUpdateActivity();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditActivityFormData>({
    resolver: zodResolver(editActivitySchema),
    defaultValues: {
      fileSource: "current",
      due_date: format(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        "dd/MM/yyyy",
        { locale: ptBR }
      ),
      due_time: "23:59",
    },
  });

  const fileSource = watch("fileSource");
  const dueDate = watch("due_date");

  useEffect(() => {
    if (open && activity) {
      const { date, time } = parseDueDateForForm(activity.due_date);
      reset({
        title: activity.title ?? "",
        description: activity.description ?? "",
        due_date: date,
        due_time: time,
        fileSource: "current",
        file: undefined,
        existingFileUrl: undefined,
      });
      setSelectedFile(null);
    }
  }, [open, activity, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("file", file);
      setValue("existingFileUrl", undefined);
    }
  };

  const handleFormSubmit = async (data: EditActivityFormData) => {
    if (!activity) return;
    setIsUploading(true);
    try {
      let file_url: string = activity.file_url;
      let file_name: string = activity.file_name;
      let file_type: string | null = activity.file_type ?? null;
      let file_size: number | null = activity.file_size ?? null;

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
          toast.error(activitiesContent.editDialog.toasts.fileNotFound);
          return;
        }
        file_url = existing.file_url;
        file_name = existing.file_name;
        file_type = existing.file_type;
        file_size = existing.file_size;
      }

      await updateActivity.mutateAsync({
        id: activity.id,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        due_date: dueDateAndTimeToIso(data.due_date, data.due_time),
        file_url,
        file_name,
        file_type,
        file_size,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error(
        activitiesContent.editDialog.toasts.error((error as Error).message)
      );
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = isUploading || updateActivity.isPending;

  if (!activity) return null;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={activitiesContent.editDialog.title}
      description={activitiesContent.editDialog.description(
        activity.students?.name ?? "—"
      )}
      size="SM"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-title">
            {activitiesContent.editDialog.titleLabel}
          </Label>
          <Input
            id="edit-title"
            placeholder={activitiesContent.editDialog.titlePlaceholder}
            {...register("title")}
            disabled={isPending}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{activitiesContent.editDialog.dueDateLabel}</Label>
          <p className="text-xs text-muted-foreground">
            {activitiesContent.editDialog.dueDateHint}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="edit-due_date"
                  variant="outline"
                  className="w-full sm:flex-1 justify-start text-left font-normal"
                  disabled={isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate || common.labels.date}
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
              id="edit-due_time"
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

        <div className="space-y-2">
          <Label htmlFor="edit-description">
            {common.labels.description} {common.labels.optional}
          </Label>
          <Textarea
            id="edit-description"
            placeholder={common.placeholders.instructionsHint}
            rows={3}
            {...register("description")}
            disabled={isPending}
          />
        </div>

        <ActivityFileSourceField
          fileSource={fileSource}
          selectedFile={selectedFile}
          existingFileUrl={watch("existingFileUrl")}
          existingFiles={existingFiles}
          isPending={isPending}
          loadingFiles={loadingFiles}
          currentFileName={activity.file_name}
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
                {activitiesContent.editDialog.submitting}
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                {activitiesContent.editDialog.submitButton}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </BaseDialog>
  );
}
