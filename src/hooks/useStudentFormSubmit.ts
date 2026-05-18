import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateStudent } from "./useStudents";
import { useInviteStudent } from "./useUserInviteMutations";
import { common, students as studentsContent } from "@/content";
import type { StudentInsert, Student } from "./useStudents";

interface UseStudentFormSubmitOptions {
  selectedStudent: Student | null;
  autoTeacherId?: string | null;
  onSuccess: () => void;
}

export const useStudentFormSubmit = ({
  selectedStudent,
  autoTeacherId,
  onSuccess,
}: UseStudentFormSubmitOptions) => {
  const updateStudent = useUpdateStudent();
  const inviteStudent = useInviteStudent();

  const submit = async (data: StudentInsert) => {
    const dataWithTeacher = autoTeacherId ? { ...data, teacher_id: autoTeacherId } : data;
    const normalizedEmail = dataWithTeacher.email?.trim().toLowerCase();

    // Check email duplicado apenas ao criar
    if (!selectedStudent && normalizedEmail) {
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (profileError) {
        toast.error(common.errors.generic);
        return;
      }
      if (existingProfile) {
        toast.error(common.errors.duplicateEmail);
        return;
      }
    }

    // Update ou create
    if (selectedStudent) {
      updateStudent.mutate(
        { id: selectedStudent.id, ...dataWithTeacher },
        {
          onSuccess: () => {
            onSuccess();
          },
        }
      );
    } else {
      inviteStudent.mutate(dataWithTeacher as StudentInsert & { teacher_id?: string | null }, {
        onSuccess: () => {
          onSuccess();
          toast.success(studentsContent.emptyState.toastCreated);
        },
      });
    }
  };

  const isPending = updateStudent.isPending || inviteStudent.isPending;

  return { submit, isPending };
};
