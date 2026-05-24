import { z } from "zod";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";
import { activities as activitiesContent } from "@/content";

export function dueDateAndTimeToIso(dueDate: string, dueTime: string): string {
  const [day, month, year] = dueDate.split("/").map(Number);
  const [hour, minute] = dueTime.split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  return local.toISOString();
}

export const activitySchema = z
  .object({
    teacher_id: z.string().optional(),
    student_id: z.string().min(1, activitiesContent.validation.studentRequired),
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
    fileSource: z.enum(["new", "existing"]),
    file: z.instanceof(File).optional(),
    existingFileUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fileSource === "new") return data.file != null;
      return !!data.existingFileUrl;
    },
    { message: activitiesContent.validation.fileRequired, path: ["file"] }
  );

export type ActivityFormData = z.infer<typeof activitySchema>;
