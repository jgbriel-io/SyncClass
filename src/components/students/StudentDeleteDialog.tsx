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
import { useUpdateStudent, useHardDeleteStudent, type Student } from "@/hooks/useStudents";
import { students as studentsContent, common } from "@/content";

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

  const handleConfirm = () => {
    if (!student) return;
    updateStudent.mutate(
      { id: student.id, status: isActive ? "inativo" : "ativo" },
      { onSuccess: onClose }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? studentsContent.archiveDialog.titleArchive : studentsContent.archiveDialog.titleReactivate}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive ? (
              <>
                {studentsContent.archiveDialog.descriptionArchive(student?.name ?? "")}
                <br />
                <br />
                <strong>{studentsContent.archiveDialog.importantLabel}</strong> {studentsContent.archiveDialog.archiveNote}
              </>
            ) : (
              studentsContent.archiveDialog.descriptionReactivate(student?.name ?? "")
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateStudent.isPending}>{common.actions.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={updateStudent.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {updateStudent.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isActive ? studentsContent.archiveDialog.archiving : studentsContent.archiveDialog.reactivating}
              </>
            ) : isActive ? (
              studentsContent.archiveDialog.confirmArchive
            ) : (
              studentsContent.archiveDialog.confirmReactivate
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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

  const handleConfirm = () => {
    if (!student) return;
    hardDeleteStudent.mutate(student.id, { onSuccess: onClose });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{studentsContent.deleteDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {studentsContent.deleteDialog.description(student?.name ?? "")}
            <br />
            <br />
            <strong className="text-destructive">{studentsContent.deleteDialog.warningLabel}</strong> {studentsContent.deleteDialog.warning}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={hardDeleteStudent.isPending}>{common.actions.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={hardDeleteStudent.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {hardDeleteStudent.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {studentsContent.deleteDialog.deleting}
              </>
            ) : (
              studentsContent.deleteDialog.confirmButton
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
