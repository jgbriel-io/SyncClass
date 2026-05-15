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
import { useDeleteTeacher, useUpdateTeacher, type Teacher } from "@/hooks/useTeachers";
import { teachers as teachersContent, common } from "@/content";

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

  const handleConfirm = () => {
    if (!teacher) return;
    if (isActive) {
      deleteTeacher.mutate(teacher.id, { onSuccess: onClose });
    } else {
      updateTeacher.mutate({ id: teacher.id, status: "ativo" }, { onSuccess: onClose });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? teachersContent.statusDialog.titleArchive : teachersContent.statusDialog.titleReactivate}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? teachersContent.statusDialog.descriptionArchive(teacher?.name ?? "")
              : teachersContent.statusDialog.descriptionReactivate(teacher?.name ?? "")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{common.actions.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isActive ? teachersContent.statusDialog.archiving : teachersContent.statusDialog.reactivating}
              </>
            ) : isActive ? (
              teachersContent.statusDialog.confirmArchive
            ) : (
              teachersContent.statusDialog.confirmReactivate
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
