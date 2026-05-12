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
import { useDeleteFinancialRecord, type FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";

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
          <AlertDialogTitle>Excluir cobrança</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Deseja excluir permanentemente a cobrança de{" "}
                <strong>{record?.students?.name}</strong> no valor de{" "}
                <strong>{record ? formatCurrency(Number(record.amount)) : ""}</strong>?
              </p>
              <p className="text-destructive font-medium">Esta ação não pode ser desfeita.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRecord.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteRecord.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRecord.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir cobrança"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
