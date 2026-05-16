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
import { formatDate } from "@/lib/utils/formatters";
import { useDeleteClassLog, type ClassLogWithStudent } from "@/hooks/useClassLogs";
import { classes as classesContent, common } from "@/content";

interface ClassDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classLog: ClassLogWithStudent | null;
  onClose: () => void;
}

export function ClassDeleteDialog({
  open,
  onOpenChange,
  classLog,
  onClose,
}: ClassDeleteDialogProps) {
  const deleteLog = useDeleteClassLog();

  const handleConfirm = () => {
    if (!classLog) return;
    deleteLog.mutate(classLog.id, { onSuccess: onClose });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{classesContent.deleteDialog.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {classesContent.deleteDialog.description(
                  classLog?.students?.name ?? "",
                  classLog ? formatDate(classLog.class_date) : ""
                )}
              </p>
              {classLog?.financial_records?.[0]?.status === "pago" ? (
                <p className="text-destructive font-medium">
                  {classesContent.deleteDialog.warningPaid}
                </p>
              ) : classLog?.financial_records?.length ? (
                <span className="block text-warning">
                  {classesContent.deleteDialog.warningLinked}
                </span>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLog.isPending}>{common.actions.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteLog.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteLog.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {classesContent.deleteDialog.deleting}
              </>
            ) : (
              classesContent.deleteDialog.confirmButton
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
