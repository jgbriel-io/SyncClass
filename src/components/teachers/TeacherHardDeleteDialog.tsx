import { useState } from "react";
import { toast } from "sonner";
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
  const [scheduledCount, setScheduledCount] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!teacher) return;
    hardDeleteTeacher.mutate(
      { id: teacher.id, force: false },
      {
        onSuccess: onClose,
        onError: (error) => {
          const msg = (error as Error).message;
          if (msg.includes("aula(s) agendada(s)")) {
            const count = msg.match(/(\d+) aula\(s\)/)?.[1] ?? "?";
            setScheduledCount(count);
          }
        },
      }
    );
  };

  const handleForceConfirm = () => {
    if (!teacher) return;
    hardDeleteTeacher.mutate(
      { id: teacher.id, force: true },
      {
        onSuccess: () => {
          setScheduledCount(null);
          onClose();
          toast.success(teachersContent.deleteDialog.toasts.forceSuccess);
        },
      }
    );
  };

  // Second step: confirm force-delete when scheduled classes exist
  if (scheduledCount !== null) {
    return (
      <ConfirmHardDeleteDialog
        open
        onOpenChange={() => {
          setScheduledCount(null);
          onClose();
        }}
        title={teachersContent.deleteDialog.scheduledTitle}
        description={teachersContent.deleteDialog.scheduledDescription(
          scheduledCount
        )}
        confirmLabel={teachersContent.deleteDialog.forceConfirmButton}
        loadingLabel={teachersContent.deleteDialog.deleting}
        isPending={hardDeleteTeacher.isPending}
        onConfirm={handleForceConfirm}
      />
    );
  }

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
      onConfirm={handleConfirm}
      warningLabel={teachersContent.deleteDialog.warningLabel}
      warning={teachersContent.deleteDialog.warning}
    />
  );
}
