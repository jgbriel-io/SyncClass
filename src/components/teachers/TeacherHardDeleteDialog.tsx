import { useState } from "react";
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
import { useHardDeleteTeacher, type Teacher } from "@/hooks/useTeachers";
import { teachers as teachersContent, common } from "@/content";

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
  // Guarda o número de aulas agendadas quando o backend retorna conflito
  const [scheduledCount, setScheduledCount] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!teacher) return;

    hardDeleteTeacher.mutate(
      { id: teacher.id, force: false },
      {
        onSuccess: onClose,
        onError: (error) => {
          const errorMessage = (error as Error).message;

          // Backend sinaliza conflito de aulas agendadas — abre confirmação extra
          if (errorMessage.includes("aula(s) agendada(s)")) {
            const numAulas = errorMessage.match(/(\d+) aula\(s\)/)?.[1] ?? "?";
            setScheduledCount(numAulas);
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

  const handleForceCancel = () => {
    setScheduledCount(null);
    onClose();
  };

  // Segundo dialog: confirmação de força quando há aulas agendadas
  if (scheduledCount !== null) {
    return (
      <AlertDialog open onOpenChange={() => handleForceCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {teachersContent.deleteDialog.scheduledTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {teachersContent.deleteDialog.scheduledDescription(scheduledCount ?? "?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={hardDeleteTeacher.isPending} onClick={handleForceCancel}>
              {common.actions.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceConfirm}
              disabled={hardDeleteTeacher.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {hardDeleteTeacher.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {teachersContent.deleteDialog.deleting}
                </>
              ) : (
                teachersContent.deleteDialog.forceConfirmButton
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">{teachersContent.deleteDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {teachersContent.deleteDialog.description(teacher?.name ?? "")}
            <br />
            <br />
            <strong className="text-destructive">Atenção:</strong> {teachersContent.deleteDialog.warning}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={hardDeleteTeacher.isPending}>{common.actions.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={hardDeleteTeacher.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {hardDeleteTeacher.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {teachersContent.deleteDialog.deleting}
              </>
            ) : (
              teachersContent.deleteDialog.confirmButton
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
