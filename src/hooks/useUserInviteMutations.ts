import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sanitizeErrorMessage } from "@/lib/utils/errorMessages";
import { toast } from "sonner";
import type { TablesInsert } from "@/integrations/supabase/types";
import { generateRandomPassword, invokeInviteUser } from "./inviteUserService";

type StudentInsert = TablesInsert<"students">;
type TeacherInsert = TablesInsert<"teachers">;

export function useInviteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StudentInsert & { teacher_id?: string | null }) => {
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
      return { ...result, createdStudent: result.createdStudent ?? { id: "" } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["students_paginated"] });
      toast.success("Aluno e conta de acesso criados com sucesso!");
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
      return { ...result, createdTeacher: result.createdTeacher ?? { id: "" } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["users_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["teachers_paginated"] });
      toast.success("Professor e conta de acesso criados com sucesso!");
    },
    onError: (error: Error) => toast.error(sanitizeErrorMessage(error)),
  });
}
