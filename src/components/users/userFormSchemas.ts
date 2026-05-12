import { z } from "zod";
import { emailSchema } from "@/lib/validation/email";
import { REGEX_PATTERNS, isValidDateString } from "@/lib/utils/patterns";

// Schema para Admin (simples)
export const adminSchema = z.object({
  email: emailSchema,
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.literal("admin"),
});

// Schema base para alunos
export const baseStudentSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: emailSchema,
  hourly_rate: z.string().min(1, "Valor por hora é obrigatório"),
  pay_day: z.string().min(1, "Dia de pagamento é obrigatório"),
  origin: z.enum(["indicacao", "google", "instagram", "passante", "outro"]),
  status: z.enum(["ativo", "inativo"]).optional(),
  birth_date: z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((val) => isValidDateString(val), { message: "Data inválida" }),
  role: z.literal("student"),
});

// Schema para alunos BRASILEIROS
export const brazilianStudentSchema = baseStudentSchema.extend({
  country: z.literal("Brasil").optional(),
  state: z.string().min(2, "Estado é obrigatório").max(2),
  city: z.string().min(2, "Cidade é obrigatória").max(100),
  phone: z.string()
    .min(1, "Telefone é obrigatório")
    .refine(
      (v) => (v.length === 14 || v.length === 15) && REGEX_PATTERNS.phone.test(v),
      "Telefone deve ter 10 ou 11 dígitos no formato (00) 00000-0000"
    ),
});

// Schema para alunos ESTRANGEIROS
export const foreignStudentSchema = baseStudentSchema.extend({
  country: z.string().min(2, "País é obrigatório").max(100),
  state: z.string().min(1, "Estado/Região é obrigatório").max(100),
  city: z.string().min(1, "Cidade é obrigatória").max(100),
  phone: z.string()
    .min(1, "Telefone é obrigatório")
    .refine(
      (v) => {
        const digitsOnly = v.replace(/\D/g, "");
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
      },
      "Telefone deve ter entre 7 e 15 dígitos"
    ),
});

// Manter compatibilidade
export const studentSchema = brazilianStudentSchema;

// Schema para Teacher (completo)
export const teacherSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: emailSchema,
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return val.length >= 14 && val.length <= 15 && REGEX_PATTERNS.phone.test(val);
      },
      { message: "Telefone deve estar no formato (00) 00000-0000 ou (00) 0000-0000" }
    ),
  role: z.literal("teacher"),
});

export type AdminFormData = z.infer<typeof adminSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type TeacherFormData = z.infer<typeof teacherSchema>;
export type FormData = AdminFormData | StudentFormData | TeacherFormData;
