import { useMemo } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { ConfirmArchiveDialog } from "@/components/ui/ConfirmArchiveDialog";
import { ConfirmHardDeleteDialog } from "@/components/ui/ConfirmHardDeleteDialog";
import {
  useDeleteUser,
  useHardDeleteUser,
  type UserWithProfile,
} from "@/hooks/useUsers";
import { useUpdateStudent, useHardDeleteStudent } from "@/hooks/useStudents";
import {
  useUpdateTeacher,
  useDeleteTeacher,
  useHardDeleteTeacher,
} from "@/hooks/useTeachers";
import type { Tables } from "@/integrations/supabase/types";
import { users as usersContent } from "@/content";

type Student = Tables<"students">;
type Teacher = Tables<"teachers">;

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithProfile | null;
  forceHardDelete: boolean;
  students: Student[];
  teachers: Teacher[];
  onClose: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  forceHardDelete,
  students,
  teachers,
  onClose,
}: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser();
  const hardDeleteUser = useHardDeleteUser();
  const updateStudent = useUpdateStudent();
  const hardDeleteStudent = useHardDeleteStudent();
  const updateTeacher = useUpdateTeacher();
  const hardDeleteTeacher = useHardDeleteTeacher();
  const deleteTeacher = useDeleteTeacher();

  const info = useMemo(() => {
    const linkedStudent = user?.student
      ? {
          id: user.student.id,
          name: user.student.name,
          status: user.student.status,
        }
      : user?.profile?.student_id
        ? (() => {
            const s = students.find((s) => s.id === user.profile?.student_id);
            return s ? { id: s.id, name: s.name, status: s.status } : null;
          })()
        : null;
    const linkedTeacher = user?.teacher
      ? { id: user.teacher.id, name: user.teacher.name }
      : user?.profile?.teacher_id
        ? (() => {
            const t = teachers.find((t) => t.id === user.profile?.teacher_id);
            return t ? { id: t.id, name: t.name } : null;
          })()
        : null;
    const isStudentActive = linkedStudent?.status === "ativo";
    const isTeacherActive = linkedTeacher !== null; // linkedTeacher object only has id+name; status check delegated to useDeleteTeacher/useUpdateTeacher
    const userIsInactive = !(user?.profile?.active ?? true);
    const hasNoLinks = !user?.profile?.student_id && !user?.profile?.teacher_id;
    const isHardDelete = forceHardDelete || (userIsInactive && hasNoLinks);
    const isArchivedProfile = userIsInactive && hasNoLinks;
    const displayName =
      user?.profile?.full_name || user?.email || "este usuário";

    return {
      linkedStudent,
      linkedTeacher,
      isStudentActive,
      isTeacherActive,
      userIsInactive,
      isHardDelete,
      isArchivedProfile,
      displayName,
    };
  }, [user, students, teachers, forceHardDelete]);

  const isPending =
    deleteUser.isPending ||
    hardDeleteStudent.isPending ||
    hardDeleteTeacher.isPending ||
    updateStudent.isPending ||
    hardDeleteUser.isPending ||
    updateTeacher.isPending ||
    deleteTeacher.isPending;

  const {
    linkedStudent,
    linkedTeacher,
    isStudentActive,
    userIsInactive,
    isHardDelete,
    isArchivedProfile,
    displayName,
  } = info;

  // ─── Reactivate ──────────────────────────────────────────────────────────────
  if (userIsInactive && !isHardDelete && !forceHardDelete) {
    return (
      <ConfirmArchiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={usersContent.deleteDialog.titleReactivate}
        description={usersContent.deleteDialog.descriptionReactivate(
          displayName
        )}
        confirmLabel={usersContent.deleteDialog.confirmReactivate}
        loadingLabel={usersContent.deleteDialog.reactivating}
        isPending={isPending}
        variant="default"
        onConfirm={() => {
          if (!user) return;
          if (linkedStudent) {
            updateStudent.mutate(
              { id: linkedStudent.id, status: "ativo" },
              {
                onSuccess: () => {
                  toast.success(usersContent.deleteDialog.toastReactivated);
                  onClose();
                },
              }
            );
            return;
          }
          if (linkedTeacher) {
            updateTeacher.mutate(
              { id: linkedTeacher.id, status: "ativo" },
              {
                onSuccess: () => {
                  toast.success(usersContent.deleteDialog.toastReactivated);
                  onClose();
                },
              }
            );
            return;
          }
          toast.error(usersContent.deleteDialog.toastNoLink);
          onClose();
        }}
      />
    );
  }

  // ─── Hard delete ─────────────────────────────────────────────────────────────
  if (isHardDelete) {
    const description = isArchivedProfile
      ? usersContent.deleteDialog.descriptionArchived(displayName)
      : usersContent.deleteDialog.descriptionHardDelete(displayName);

    return (
      <ConfirmHardDeleteDialog
        open={open}
        onOpenChange={onOpenChange}
        title={usersContent.deleteDialog.titleArchived}
        description={description}
        confirmLabel={usersContent.deleteDialog.confirmArchived}
        loadingLabel={usersContent.deleteDialog.deleting}
        isPending={isPending}
        warningLabel={usersContent.deleteDialog.warningLabel}
        warning={usersContent.deleteDialog.warning}
        onConfirm={() => {
          if (!user) return;
          // Route to domain-specific mutations to ensure anonymization
          if (linkedStudent) {
            hardDeleteStudent.mutate(
              { id: linkedStudent.id },
              {
                onSuccess: () => {
                  toast.success(usersContent.deleteDialog.toastDeleted);
                  onClose();
                },
                onError: (error) => {
                  logger.error(error as Error, {
                    context: "hard_delete_student_via_users",
                  });
                  toast.error(
                    usersContent.deleteDialog.toastDeleteError +
                      (error as Error).message
                  );
                },
              }
            );
            return;
          }
          if (linkedTeacher) {
            hardDeleteTeacher.mutate(
              { id: linkedTeacher.id },
              {
                onSuccess: () => {
                  toast.success(usersContent.deleteDialog.toastDeleted);
                  onClose();
                },
                onError: (error) => {
                  logger.error(error as Error, {
                    context: "hard_delete_teacher_via_users",
                  });
                  toast.error(
                    usersContent.deleteDialog.toastDeleteError +
                      (error as Error).message
                  );
                },
              }
            );
            return;
          }
          // No domain record — remove auth + profile only
          hardDeleteUser.mutate(user.id, {
            onSuccess: () => {
              toast.success(usersContent.deleteDialog.toastDeleted);
              onClose();
            },
            onError: (error) => {
              logger.error(error as Error, { context: "hard_delete_user" });
              toast.error(
                usersContent.deleteDialog.toastDeleteError +
                  (error as Error).message
              );
            },
          });
        }}
      />
    );
  }

  // ─── Archive (active user) ────────────────────────────────────────────────────
  const archiveDescription =
    linkedStudent && isStudentActive
      ? usersContent.deleteDialog.descriptionArchiveStudent(displayName)
      : linkedTeacher
        ? usersContent.deleteDialog.descriptionArchiveTeacher(displayName)
        : usersContent.deleteDialog.descriptionArchiveGeneric(displayName);

  return (
    <ConfirmArchiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={usersContent.deleteDialog.titleArchive}
      description={archiveDescription}
      confirmLabel={usersContent.deleteDialog.confirmArchive}
      loadingLabel={usersContent.deleteDialog.archiving}
      isPending={isPending}
      onConfirm={() => {
        if (!user) return;
        if (linkedStudent && isStudentActive) {
          updateStudent.mutate(
            { id: linkedStudent.id, status: "inativo" },
            {
              onSuccess: () => {
                toast.success(usersContent.deleteDialog.toastArchived);
                onClose();
              },
              onError: () => {
                toast.error(usersContent.deleteDialog.toastArchiveError);
              },
            }
          );
          return;
        }
        if (linkedTeacher) {
          deleteTeacher.mutate(linkedTeacher.id, {
            onSuccess: () => {
              toast.success(usersContent.deleteDialog.toastArchived);
              onClose();
            },
          });
          return;
        }
        deleteUser.mutate(user.id, {
          onSuccess: () => {
            toast.success(usersContent.deleteDialog.toastArchived);
            onClose();
          },
        });
      }}
    />
  );
}
