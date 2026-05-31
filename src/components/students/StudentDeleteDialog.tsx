import { ConfirmArchiveDialog } from "@/components/ui/ConfirmArchiveDialog";
import { ConfirmHardDeleteDialog } from "@/components/ui/ConfirmHardDeleteDialog";
import {
  useUpdateStudent,
  useHardDeleteStudent,
  type Student,
} from "@/hooks/useStudents";
import { students as studentsContent } from "@/content";

// ─── Archive / Reactivate Dialog ─────────────────────────────────────────────

interface StudentArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onClose: () => void;
}

export function StudentArchiveDialog({
  open,
  onOpenChange,
  student,
  onClose,
}: StudentArchiveDialogProps) {
  const updateStudent = useUpdateStudent();
  const isActive = student?.status === "ativo";

  return (
    <ConfirmArchiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isActive
          ? studentsContent.archiveDialog.titleArchive
          : studentsContent.archiveDialog.titleReactivate
      }
      description={
        isActive ? (
          <>
            {studentsContent.archiveDialog.descriptionArchive(
              student?.name ?? ""
            )}
            <br />
            <br />
            <strong>{studentsContent.archiveDialog.importantLabel}</strong>{" "}
            {studentsContent.archiveDialog.archiveNote}
          </>
        ) : (
          studentsContent.archiveDialog.descriptionReactivate(
            student?.name ?? ""
          )
        )
      }
      confirmLabel={
        isActive
          ? studentsContent.archiveDialog.confirmArchive
          : studentsContent.archiveDialog.confirmReactivate
      }
      loadingLabel={
        isActive
          ? studentsContent.archiveDialog.archiving
          : studentsContent.archiveDialog.reactivating
      }
      isPending={updateStudent.isPending}
      onConfirm={() => {
        if (!student) return;
        updateStudent.mutate(
          { id: student.id, status: isActive ? "inativo" : "ativo" },
          { onSuccess: onClose }
        );
      }}
      variant={isActive ? "destructive" : "default"}
    />
  );
}

// ─── Hard Delete Dialog ───────────────────────────────────────────────────────

interface StudentHardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onClose: () => void;
}

export function StudentHardDeleteDialog({
  open,
  onOpenChange,
  student,
  onClose,
}: StudentHardDeleteDialogProps) {
  const hardDeleteStudent = useHardDeleteStudent();

  return (
    <ConfirmHardDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={studentsContent.deleteDialog.title}
      description={studentsContent.deleteDialog.description(
        student?.name ?? ""
      )}
      confirmLabel={studentsContent.deleteDialog.confirmButton}
      loadingLabel={studentsContent.deleteDialog.deleting}
      isPending={hardDeleteStudent.isPending}
      onConfirm={() => {
        if (!student) return;
        hardDeleteStudent.mutate({ id: student.id }, { onSuccess: onClose });
      }}
      warningLabel={studentsContent.deleteDialog.warningLabel}
      warning={studentsContent.deleteDialog.warning}
    />
  );
}
