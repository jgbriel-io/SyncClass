import { useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/sentry";
import {
  useDeleteUser,
  useHardDeleteUser,
  type UserWithProfile,
} from "@/hooks/useUsers";
import { useUpdateStudent, useHardDeleteStudent } from "@/hooks/useStudents";
import { useUpdateTeacher, useDeleteTeacher, useHardDeleteTeacher } from "@/hooks/useTeachers";
import type { Tables } from "@/integrations/supabase/types";
import { common, users as usersContent } from "@/content";

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

  const isPending =
    deleteUser.isPending ||
    hardDeleteStudent.isPending ||
    updateStudent.isPending ||
    hardDeleteUser.isPending ||
    updateTeacher.isPending ||
    deleteTeacher.isPending;

  const info = useMemo(() => {
    const linkedStudent = user?.profile?.student_id
      ? students.find((s) => s.id === user.profile?.student_id)
      : null;
    const linkedTeacher = user?.profile?.teacher_id
      ? teachers.find((t) => t.id === user.profile?.teacher_id)
      : null;
    const isStudentActive = linkedStudent?.status === "ativo";
    const isTeacherActive = (linkedTeacher?.status ?? "ativo") === "ativo";
    const userIsInactive = !(user?.profile?.active ?? true);
    const hasNoLinks =
      !user?.profile?.student_id && !user?.profile?.teacher_id;
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

  const handleConfirm = () => {
    if (!user) return;

    const {
      linkedStudent,
      linkedTeacher,
      isStudentActive,
      isTeacherActive,
      isHardDelete,
      userIsInactive,
    } = info;

    // Reativação
    if (userIsInactive && !isHardDelete && !forceHardDelete) {
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
      return;
    }

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

    if (linkedTeacher && isTeacherActive) {
      deleteTeacher.mutate(linkedTeacher.id, {
        onSuccess: () => {
          toast.success(usersContent.deleteDialog.toastArchived);
          onClose();
        },
      });
      return;
    }

    if (isHardDelete) {
      hardDeleteUser.mutate(user.id, {
        onSuccess: () => {
          toast.success(usersContent.deleteDialog.toastDeleted);
          onClose();
        },
        onError: (error) => {
          logger.error(error as Error, { context: "delete_user" });
          toast.error(usersContent.deleteDialog.toastDeleteError + (error as Error).message);
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
  };

  const title = info.isArchivedProfile
    ? usersContent.deleteDialog.titleArchived
    : info.isHardDelete
    ? usersContent.deleteDialog.titleHard
    : info.userIsInactive && !forceHardDelete
    ? usersContent.deleteDialog.titleReactivate
    : usersContent.deleteDialog.titleArchive;

  const actionLabel = info.isArchivedProfile
    ? usersContent.deleteDialog.confirmArchived
    : info.isHardDelete
    ? usersContent.deleteDialog.confirmHard
    : info.userIsInactive && !forceHardDelete
    ? usersContent.deleteDialog.confirmReactivate
    : usersContent.deleteDialog.confirmArchive;

  const isDestructive = !(info.userIsInactive && !forceHardDelete);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {info.isArchivedProfile ? (
              <>
                Tem certeza que deseja excluir o arquivo morto do usuário{" "}
                <strong>{info.displayName}</strong>?
                <br />
                <br />
                A conta será removida do sistema (Supabase Auth e perfil). O
                email ficará disponível para reutilização. Esta ação não pode
                ser desfeita.
              </>
            ) : info.isHardDelete ? (
              <>
                A conta do usuário <strong>{info.displayName}</strong> será
                removida do sistema (Supabase Auth, perfil e vínculos). Esta
                ação não pode ser desfeita.
              </>
            ) : info.userIsInactive && !forceHardDelete ? (
              <>
                Tem certeza que deseja reativar o usuário{" "}
                <strong>{info.displayName}</strong>? Ele voltará a aparecer na
                lista de usuários ativos.
              </>
            ) : info.linkedStudent && info.isStudentActive ? (
              <>
                Tem certeza que deseja arquivar o usuário{" "}
                <strong>{info.displayName}</strong>? Ele será removido da lista
                de ativos e aparecerá como aluno inativo.
              </>
            ) : info.linkedTeacher && info.isTeacherActive ? (
              <>
                Tem certeza que deseja arquivar o usuário{" "}
                <strong>{info.displayName}</strong>? Ele será removido da lista
                de ativos e aparecerá como professor inativo.
              </>
            ) : (
              <>
                Tem certeza que deseja arquivar o usuário{" "}
                <strong>{info.displayName}</strong>? Esta ação não remove a
                conta do Supabase Auth, apenas arquiva o usuário no painel.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{common.actions.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {info.isHardDelete
                  ? common.actions.deleting
                  : info.userIsInactive && !forceHardDelete
                  ? usersContent.deleteDialog.reactivating
                  : usersContent.deleteDialog.archiving}
              </>
            ) : (
              actionLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
