import { z } from "zod";
import { emailSchema } from "@/lib/validation/email";
import { REGEX_PATTERNS, isValidDateString } from "@/lib/utils/patterns";
import { students as studentsContent, teachers as teachersContent, users as usersContent } from "@/content";

// Schema para Admin (simples)
export const adminSchema = z.object({
  email: emailSchema,
  fullName: z.string().min(2, usersContent.validation.nameMin),
  role: z.literal("admin"),
});

// Schema base para alunos
export const baseStudentSchema = z.object({
  name: z.string().min(2, studentsContent.validation.nameMin).max(100),
  email: emailSchema,
  hourly_rate: z.string().min(1, "Valor por hora é obrigatório"),
  pay_day: z.string().min(1, "Dia de pagamento é obrigatório"),
  origin: z.enum(["indicacao", "google", "instagram", "passante", "outro"]),
  status: z.enum(["ativo", "inativo"]).optional(),
  birth_date: z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((val) => isValidDateString(val), { message: studentsContent.validation.birthDateInvalid }),
  role: z.literal("student"),
});

// Schema para alunos BRASILEIROS
export const brazilianStudentSchema = baseStudentSchema.extend({
  country: z.literal("Brasil").optional(),
  state: z.string().min(2, studentsContent.validation.stateRequired).max(2),
  city: z.string().min(2, studentsContent.validation.cityRequired).max(100),
  phone: z.string()
    .min(1, studentsContent.validation.phoneRequired)
    .refine(
      (v) => (v.length === 14 || v.length === 15) && REGEX_PATTERNS.phone.test(v),
      studentsContent.validation.phoneDigits
    ),
});

// Schema para alunos ESTRANGEIROS
export const foreignStudentSchema = baseStudentSchema.extend({
  country: z.string().min(2, studentsContent.validation.countryRequired).max(100),
  state: z.string().min(1, studentsContent.validation.stateRequired).max(100),
  city: z.string().min(1, studentsContent.validation.cityRequired).max(100),
  phone: z.string()
    .min(1, studentsContent.validation.phoneRequired)
    .refine(
      (v) => {
        const digitsOnly = v.replace(/\D/g, "");
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
      },
      studentsContent.validation.phoneDigits
    ),
});

// Manter compatibilidade
export const studentSchema = brazilianStudentSchema;

// Schema para Teacher (completo)
export const teacherSchema = z.object({
  name: z.string().min(2, teachersContent.validation.nameMin).max(100),
  email: emailSchema,
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return val.length >= 14 && val.length <= 15 && REGEX_PATTERNS.phone.test(val);
      },
      { message: teachersContent.validation.phoneFormat }
    ),
  role: z.literal("teacher"),
});

export type AdminFormData = z.infer<typeof adminSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type TeacherFormData = z.infer<typeof teacherSchema>;
export type FormData = AdminFormData | StudentFormData | TeacherFormData;
