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
            {isActive ? "Confirmar arquivamento" : "Confirmar reativação"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive ? (
              <>
                Tem certeza que deseja arquivar o professor{" "}
                <strong>{teacher?.name}</strong>? Ele será removido da lista de ativos, mas
                poderá ser visualizado em "Inativos".
              </>
            ) : (
              <>
                Tem certeza que deseja reativar o professor{" "}
                <strong>{teacher?.name}</strong>? Ele voltará para a lista de ativos e terá o
                acesso reativado.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isActive ? "Arquivando..." : "Reativando..."}
              </>
            ) : isActive ? (
              "Arquivar"
            ) : (
              "Reativar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
