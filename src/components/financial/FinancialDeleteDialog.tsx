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
import { formatCurrency } from "@/lib/utils/formatters";
import {
  useDeleteFinancialRecord,
  type FinancialRecordWithRelations,
} from "@/hooks/useFinancialRecords";
import { financial } from "@/content";

interface FinancialDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FinancialRecordWithRelations | null;
  onClose: () => void;
}

export function FinancialDeleteDialog({
  open,
  onOpenChange,
  record,
  onClose,
}: FinancialDeleteDialogProps) {
  const deleteRecord = useDeleteFinancialRecord();

  const handleConfirm = () => {
    if (!record) return;
    deleteRecord.mutate(record.id, { onSuccess: onClose });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{financial.deleteDialog.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {financial.deleteDialog.description(
                  record?.students?.name ?? "",
                  record ? formatCurrency(Number(record.amount)) : ""
                )}
              </p>
              <p className="text-destructive font-medium">
                {financial.deleteDialog.irreversible}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRecord.isPending}>
            {financial.deleteDialog.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteRecord.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRecord.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {financial.deleteDialog.deleting}
              </>
            ) : (
              financial.deleteDialog.confirmButton
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
