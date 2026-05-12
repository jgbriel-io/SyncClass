import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useDeleteActivity, type ActivityWithRelations } from "@/hooks/useActivities";

interface ActivityDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ActivityWithRelations | null;
  onClose: () => void;
}

export function ActivityDeleteDialog({ open, onOpenChange, activity, onClose }: ActivityDeleteDialogProps) {
  const deleteActivity = useDeleteActivity();

  const handleConfirm = () => {
    if (!activity) return;
    deleteActivity.mutate(activity.id, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a atividade{" "}
            <strong>{activity?.title}</strong>?<br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteActivity.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteActivity.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteActivity.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>
            ) : (
              "Excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
