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
import { useState } from "react";
import { formatCurrency } from "@/lib/utils/formatters";
import { useConfirmPayment, type FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";

interface FinancialConfirmPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FinancialRecordWithRelations | null;
  onClose: () => void;
}

export function FinancialConfirmPaymentDialog({
  open,
  onOpenChange,
  record,
  onClose,
}: FinancialConfirmPaymentDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const confirmPayment = useConfirmPayment();

  const isPending = confirmPayment.isPending || isProcessing;
  const isEarlyPayment = record?.class_logs && record.class_logs.attendance == null;

  const handleConfirm = () => {
    if (!record || isProcessing) return;
    setIsProcessing(true);
    confirmPayment.mutate(record.id, {
      onSuccess: () => {
        setIsProcessing(false);
        onClose();
      },
      onError: () => setIsProcessing(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isEarlyPayment ? "Atenção: confirmar pagamento antecipado" : "Confirmar pagamento"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {isEarlyPayment ? (
                <p>
                  <span className="font-medium text-foreground block mb-1">
                    Esta cobrança está vinculada a uma aula que ainda não foi concluída.
                  </span>
                  O pagamento já foi realizado? Ao confirmar, a cobrança de{" "}
                  <strong>{record?.students?.name}</strong> no valor de{" "}
                  <strong>{record ? formatCurrency(Number(record.amount)) : ""}</strong> será
                  marcada como paga.
                </p>
              ) : (
                <p>
                  Deseja marcar como pago a cobrança de{" "}
                  <strong>{record?.students?.name}</strong> no valor de{" "}
                  <strong>{record ? formatCurrency(Number(record.amount)) : ""}</strong>?
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Confirmar Pagamento"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
