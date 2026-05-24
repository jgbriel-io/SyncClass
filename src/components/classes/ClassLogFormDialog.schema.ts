import { z } from "zod";
import {
  isValidDateString,
  parseMoneyToNumber,
  REGEX_PATTERNS,
} from "@/lib/utils/patterns";
import {
  brDateToIso,
  getDefaultDueDateForClassLog,
} from "@/lib/utils/classFormHelpers";
import { classes as classesContent } from "@/content";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isoDateToBr(value: string): string {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
}

export function isDateFuture(brDate: string): boolean {
  if (!brDate || !REGEX_PATTERNS.date.test(brDate)) return false;
  const iso = brDateToIso(brDate);
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

export function getDefaultDueDateForClassMonth(
  classDateBr: string,
  payDay: number | null
): string {
  return getDefaultDueDateForClassLog(classDateBr, payDay, REGEX_PATTERNS.date);
}

export function extractTimeFromIso(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const classLogBaseSchema = z
  .object({
    student_id: z.string().min(1, classesContent.validation.studentRequired),
    class_date: z
      .string()
      .min(1, classesContent.validation.dateRequired)
      .regex(REGEX_PATTERNS.date, classesContent.validation.dateFormat)
      .refine(isValidDateString, {
        message: classesContent.validation.dateInvalid,
      })
      .refine(
        (val) => {
          if (!val || !REGEX_PATTERNS.date.test(val)) return true;
          const [, , year] = val.split("/").map(Number);
          return year >= 2026;
        },
        { message: classesContent.validation.dateMinYear }
      ),
    title: z.string().optional(),
    feedback: z.string().max(1000).optional(),
    observations: z
      .string()
      .max(1000, classesContent.validation.observationsMaxLength)
      .optional(),
    start_time: z
      .string()
      .optional()
      .refine((v) => !v || REGEX_PATTERNS.time.test(v), {
        message: classesContent.validation.timeFormat,
      }),
    end_time: z
      .string()
      .optional()
      .refine((v) => !v || REGEX_PATTERNS.time.test(v), {
        message: classesContent.validation.timeFormat,
      }),
    grade: z
      .number({ invalid_type_error: classesContent.validation.gradeRange })
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    financial_amount: z.string().optional(),
    financial_due_date: z
      .string()
      .optional()
      .refine((val) => !val || isValidDateString(val), {
        message: "Data inválida",
      }),
    financial_description: z.string().optional(),
    financial_payment_method: z.string().optional(),
    semCobranca: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;
      const [sh, sm] = data.start_time.split(":").map(Number);
      const [eh, em] = data.end_time.split(":").map(Number);
      return eh > sh || (eh === sh && em > sm);
    },
    { message: classesContent.validation.endTimeAfterStart, path: ["end_time"] }
  );

export function createClassLogSchema(isEditing: boolean) {
  return classLogBaseSchema
    .refine(
      (data) => {
        if (isEditing || data.semCobranca) return true;
        const a = parseMoneyToNumber(data.financial_amount || "");
        return !isNaN(a) && a > 0;
      },
      {
        message: classesContent.validation.amountRequired,
        path: ["financial_amount"],
      }
    )
    .refine(
      (data) => {
        if (isEditing || data.semCobranca) return true;
        return !!(data.financial_due_date && data.financial_due_date.trim());
      },
      {
        message: classesContent.validation.dueDateRequired,
        path: ["financial_due_date"],
      }
    );
}

export type ClassLogFormData = z.infer<ReturnType<typeof createClassLogSchema>>;

export interface ClassLogFinancialUpdate {
  financialRecordId: string;
  dueDate: string;
  amount?: number;
}
