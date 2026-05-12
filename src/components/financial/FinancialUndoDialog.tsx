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
          <AlertDialogTitle>Desfazer cobrança</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Deseja desfazer o pagamento da cobrança de{" "}
                <strong>{record?.students?.name}</strong> no valor de{" "}
                <strong>{record ? formatCurrency(Number(record.amount)) : ""}</strong>?
              </p>
              {record?.class_logs && record.class_logs.attendance != null ? (
                <p className="text-destructive font-medium">
                  Esta cobrança está vinculada a uma aula já concluída/confirmada. Deseja desfazer
                  mesmo assim?
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={undoPayment.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={undoPayment.isPending}>
            {undoPayment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desfazendo...
              </>
            ) : (
              "Desfazer cobrança"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
