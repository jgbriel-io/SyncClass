import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { financial } from "@/content";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import type { FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";

interface FinancialPaymentHistoryDialogProps {
  record: FinancialRecordWithRelations | null;
  onClose: () => void;
}

export function FinancialPaymentHistoryDialog({
  record,
  onClose,
}: FinancialPaymentHistoryDialogProps) {
  const { user } = useAuth();
  const { data: currentUserProfile } = useCurrentUserProfile(user?.id);

  const r = record;

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {financial.paymentHistoryDialog.title}
          </DialogTitle>
        </DialogHeader>

        {r && (
          <div className="space-y-3 pr-2">
            <p className="text-sm text-muted-foreground break-words">
              {r.students?.name} · {formatCurrency(Number(r.amount))}
            </p>

            {r.description && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {financial.paymentHistoryDialog.descriptionLabel}
                </p>
                <p className="text-sm text-foreground break-words overflow-wrap-anywhere">
                  {r.description}
                </p>
              </div>
            )}

            {r.status === "pago" && r.confirmed_by ? (
              <div className="rounded-lg border bg-success/10 border-success/20 p-3 text-sm">
                {currentUserProfile?.role === "admin" ? (
                  <>
                    <p className="font-medium text-foreground break-words overflow-wrap-anywhere">
                      {r.confirmed_by.deleted_at
                        ? financial.paymentHistoryDialog.confirmedByRemoved
                        : `${financial.paymentHistoryDialog.confirmedBy} ${r.confirmed_by.full_name}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {r.updated_at
                        ? formatDateTime(r.updated_at)
                        : financial.paymentHistoryDialog.dateUnavailable}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-foreground break-words">
                      {financial.paymentHistoryDialog.paymentConfirmed}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {r.updated_at
                        ? formatDateTime(r.updated_at)
                        : financial.paymentHistoryDialog.dateUnavailable}
                    </p>
                  </>
                )}
              </div>
            ) : r.status === "pago" ? (
              <div className="rounded-lg border bg-success/10 border-success/20 p-3 text-sm">
                <p className="font-medium text-foreground break-words">
                  {financial.paymentHistoryDialog.paymentConfirmed}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  {r.updated_at
                    ? formatDateTime(r.updated_at)
                    : financial.paymentHistoryDialog.dateUnavailable}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground break-words">
                {financial.paymentHistoryDialog.noPayment}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
