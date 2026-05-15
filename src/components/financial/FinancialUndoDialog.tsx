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
import { useUndoFinancialPayment, type FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";
import { financial } from "@/content";

interface FinancialUndoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FinancialRecordWithRelations | null;
  onClose: () => void;
}

export function FinancialUndoDialog({
  open,
  onOpenChange,
  record,
  onClose,
}: FinancialUndoDialogProps) {
  const undoPayment = useUndoFinancialPayment();

  const handleConfirm = () => {
    if (!record) return;
    undoPayment.mutate(record.id, { onSettled: onClose });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{financial.undoDialog.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {financial.undoDialog.description(
                  record?.students?.name ?? "",
                  record ? formatCurrency(Number(record.amount)) : ""
                )}
              </p>
              {record?.class_logs && record.class_logs.attendance != null ? (
                <p className="text-destructive font-medium">
                  {financial.undoDialog.warningLinked}
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={undoPayment.isPending}>{financial.undoDialog.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={undoPayment.isPending}>
            {undoPayment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {financial.undoDialog.processing}
              </>
            ) : (
              financial.undoDialog.confirmButton
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
