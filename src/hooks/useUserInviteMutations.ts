import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sanitizeErrorMessage } from "@/lib/security/errorHandler";
import { QK } from "./queryKeys";
import { toast } from "sonner";
import type { TablesInsert } from "@/integrations/supabase/types";
import { users as usersContent } from "@/content";
import { generateRandomPassword, invokeInviteUser } from "./inviteUserService";
import { supabase } from "@/integrations/supabase/client";

function sendWelcomeEmail(email: string) {
  supabase.auth
    .resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    .catch(() => {
      /* fire-and-forget — invite succeeded even if email fails */
    });
}

type StudentInsert = TablesInsert<"students">;
type TeacherInsert = TablesInsert<"teachers">;

export function useInviteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: StudentInsert & { teacher_id?: string | null }
    ) => {
      const email = (data.email ?? "").trim().toLowerCase();
      if (!email) throw new Error("Email é obrigatório");
      const result = await invokeInviteUser({
        email,
        password: generateRandomPassword(),
        full_name: data.name,
        role: "student",
        teacher_id: data.teacher_id ?? undefined,
        studentData: data as Partial<StudentInsert>,
      });
      sendWelcomeEmail(email);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.STUDENTS_PAGINATED] });
    },
    onError: (error: Error) => toast.error(sanitizeErrorMessage(error)),
  });
}

export function useInviteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TeacherInsert) => {
      const email = (data.email ?? "").trim().toLowerCase();
      if (!email) throw new Error("Email é obrigatório");
      const result = await invokeInviteUser({
        email,
        password: generateRandomPassword(),
        full_name: data.name,
        role: "teacher",
        teacherData: data as Partial<TeacherInsert>,
      });
      sendWelcomeEmail(email);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS] });
      queryClient.invalidateQueries({ queryKey: [QK.PROFILES] });
      queryClient.invalidateQueries({ queryKey: [QK.USERS_PAGINATED] });
      queryClient.invalidateQueries({ queryKey: [QK.TEACHERS_PAGINATED] });
      toast.success(usersContent.formDialog.toasts.successTeacherInvite);
    },
    onError: (error: Error) => toast.error(sanitizeErrorMessage(error)),
  });
}
