import { ConfirmHardDeleteDialog } from "@/components/ui/ConfirmHardDeleteDialog";
import { useHardDeleteTeacher, type Teacher } from "@/hooks/useTeachers";
import { teachers as teachersContent } from "@/content";

interface TeacherHardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
  onClose: () => void;
}

export function TeacherHardDeleteDialog({
  open,
  onOpenChange,
  teacher,
  onClose,
}: TeacherHardDeleteDialogProps) {
  const hardDeleteTeacher = useHardDeleteTeacher();

  return (
    <ConfirmHardDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={teachersContent.deleteDialog.title}
      description={teachersContent.deleteDialog.description(
        teacher?.name ?? ""
      )}
      confirmLabel={teachersContent.deleteDialog.confirmButton}
      loadingLabel={teachersContent.deleteDialog.deleting}
      isPending={hardDeleteTeacher.isPending}
      onConfirm={() => {
        if (!teacher) return;
        hardDeleteTeacher.mutate(
          { id: teacher.id, force: true },
          { onSuccess: onClose }
        );
      }}
      warningLabel={teachersContent.deleteDialog.warningLabel}
      warning={teachersContent.deleteDialog.warning}
      checkboxLabel={teachersContent.deleteDialog.checkboxLabel}
    />
  );
}
