import { ConfirmArchiveDialog } from "@/components/ui/ConfirmArchiveDialog";
import {
  useDeleteTeacher,
  useUpdateTeacher,
  type Teacher,
} from "@/hooks/useTeachers";
import { teachers as teachersContent } from "@/content";

interface TeacherStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
  onClose: () => void;
}

export function TeacherStatusDialog({
  open,
  onOpenChange,
  teacher,
  onClose,
}: TeacherStatusDialogProps) {
  const deleteTeacher = useDeleteTeacher();
  const updateTeacher = useUpdateTeacher();
  const isActive = (teacher?.status ?? "ativo") === "ativo";
  const isPending = deleteTeacher.isPending || updateTeacher.isPending;

  return (
    <ConfirmArchiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isActive
          ? teachersContent.statusDialog.titleArchive
          : teachersContent.statusDialog.titleReactivate
      }
      description={
        isActive
          ? teachersContent.statusDialog.descriptionArchive(teacher?.name ?? "")
          : teachersContent.statusDialog.descriptionReactivate(
              teacher?.name ?? ""
            )
      }
      confirmLabel={
        isActive
          ? teachersContent.statusDialog.confirmArchive
          : teachersContent.statusDialog.confirmReactivate
      }
      loadingLabel={
        isActive
          ? teachersContent.statusDialog.archiving
          : teachersContent.statusDialog.reactivating
      }
      isPending={isPending}
      onConfirm={() => {
        if (!teacher) return;
        if (isActive) {
          deleteTeacher.mutate(teacher.id, { onSuccess: onClose });
        } else {
          updateTeacher.mutate(
            { id: teacher.id, status: "ativo" },
            { onSuccess: onClose }
          );
        }
      }}
      variant={isActive ? "destructive" : "default"}
    />
  );
}
