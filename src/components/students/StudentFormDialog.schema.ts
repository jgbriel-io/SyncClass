import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";
import { isValidDateString } from "@/lib/utils/patterns";
import { emailSchema } from "@/lib/validation/email";
import { students as studentsContent } from "@/content";

export type StudentOrigin = Enums<"student_origin">;
export type StudentStatus = Enums<"student_status">;

export const studentSchema = z.object({
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
    .refine((val) => !val || isValidDateString(val), {
      message: studentsContent.validation.birthDateInvalid,
    }),
  country: z
    .string()
    .min(2, studentsContent.validation.countryRequired)
    .max(100),
  state: z.string().min(1, studentsContent.validation.stateRequired).max(100),
  city: z.string().min(1, studentsContent.validation.cityRequired).max(100),
  phone: z
    .string()
    .min(1, studentsContent.validation.phoneRequired)
    .refine((v) => {
      const digitsOnly = v.replace(/\D/g, "");
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }, studentsContent.validation.phoneDigits),
});

export type StudentFormData = z.infer<typeof studentSchema>;
