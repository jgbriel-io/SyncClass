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
import {
  useDeleteActivity,
  type ActivityWithRelations,
} from "@/hooks/useActivities";
import { activities as activitiesContent, common } from "@/content";

interface ActivityDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ActivityWithRelations | null;
  onClose: () => void;
}

export function ActivityDeleteDialog({
  open,
  onOpenChange,
  activity,
  onClose,
}: ActivityDeleteDialogProps) {
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
          <AlertDialogTitle>
            {activitiesContent.deleteDialog.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {activitiesContent.deleteDialog.description(activity?.title ?? "")}
            <br />
            {activitiesContent.deleteDialog.irreversible}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteActivity.isPending}>
            {common.actions.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteActivity.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteActivity.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {activitiesContent.deleteDialog.deleting}
              </>
            ) : (
              activitiesContent.deleteDialog.confirmButton
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
