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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  useUpdateFinancialStatus,
  useRefundAbacatePayment,
  type FinancialRecordWithRelations,
} from "@/hooks/useFinancialRecords";
import { financial } from "@/content";

interface FinancialRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FinancialRecordWithRelations | null;
  onClose: () => void;
}

export function FinancialRefundDialog({
  open,
  onOpenChange,
  record,
  onClose,
}: FinancialRefundDialogProps) {
  const updateStatus = useUpdateFinancialStatus();
  const refundAbacate = useRefundAbacatePayment();
  const [reason, setReason] = useState("");

  const isAbacatePay =
    record?.payment_provider === "abacate_pay" && !!record?.external_payment_id;
  const isPending = isAbacatePay
    ? refundAbacate.isPending
    : updateStatus.isPending;
  const buttonLabel = isPending
    ? isAbacatePay
      ? financial.refundDialog.processingAbacate
      : financial.refundDialog.processing
    : isAbacatePay
      ? financial.refundDialog.confirmButtonAbacate
      : financial.refundDialog.confirmButton;

  const handleConfirm = () => {
    if (!record) return;
    if (isAbacatePay) {
      refundAbacate.mutate(
        { financialRecordId: record.id, reason: reason.trim() || undefined },
        { onSuccess: onClose }
      );
    } else {
      updateStatus.mutate(
        { id: record.id, status: "extornado" },
        { onSuccess: onClose }
      );
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setReason("");
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{financial.refundDialog.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {financial.refundDialog.description(
                  record?.students?.name ?? "",
                  record ? formatCurrency(Number(record.amount)) : ""
                )}
              </p>
              <p className="text-warning font-medium">
                {isAbacatePay
                  ? financial.refundDialog.warningAbacate
                  : financial.refundDialog.warning}
              </p>
              {record?.class_logs?.attendance != null && (
                <p className="text-destructive font-medium">
                  {financial.refundDialog.warningLinked}
                </p>
              )}
              {isAbacatePay ? (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs">
                    {financial.refundDialog.reasonLabel}
                  </Label>
                  <Input
                    placeholder={financial.refundDialog.reasonPlaceholder}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isPending}
                    maxLength={200}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {financial.refundDialog.manualInstructions}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {financial.refundDialog.cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
