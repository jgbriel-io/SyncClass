import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { financial, common } from "@/content";
import { formatCurrency, formatDateTime } from "@/lib/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import type { FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";

// Tipo estendido para campos de comprovante (não tipados no schema base)
type RecordWithProof = FinancialRecordWithRelations & {
  payment_proof_url?: string | null;
  payment_proof_filename?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_proof_status?: "pending" | "approved" | "rejected" | null;
  payment_proof_rejection_reason?: string | null;
};

interface FinancialPaymentHistoryDialogProps {
  record: FinancialRecordWithRelations | null;
  onClose: () => void;
  /** Abre o dialog de confirmar pagamento para o record atual */
  onConfirmPayment: (record: FinancialRecordWithRelations) => void;
}

export function FinancialPaymentHistoryDialog({
  record,
  onClose,
  onConfirmPayment,
}: FinancialPaymentHistoryDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: currentUserProfile } = useCurrentUserProfile(user?.id);

  const r = record as RecordWithProof | null;

  const handleApproveProof = async () => {
    if (!r) return;
    try {
      await supabase.rpc("review_payment_proof", {
        p_financial_record_id: r.id,
        p_approved: true,
        p_rejection_reason: null,
      });
      toast.success(financial.paymentHistoryDialog.toasts.approveSuccess);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["financial-records"] });
    } catch {
      toast.error(financial.paymentHistoryDialog.toasts.approveError);
    }
  };

  const handleRejectProof = async () => {
    if (!r) return;
    try {
      await supabase.rpc("review_payment_proof", {
        p_financial_record_id: r.id,
        p_approved: false,
        p_rejection_reason: "Comprovante inválido",
      });
      toast.success(financial.paymentHistoryDialog.toasts.rejectSuccess);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["financial-records"] });
    } catch {
      toast.error(financial.paymentHistoryDialog.toasts.rejectError);
    }
  };

  const handleViewProof = async () => {
    if (!r?.payment_proof_url) return;
    try {
      const { getPaymentProofUrl } = await import("@/hooks/usePaymentProof");
      const url = await getPaymentProofUrl(r.payment_proof_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(financial.paymentHistoryDialog.toasts.proofOpenError);
    }
  };

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{financial.paymentHistoryDialog.title}</DialogTitle>
        </DialogHeader>

        {r && (
          <div className="space-y-3 pr-2">
            <p className="text-sm text-muted-foreground break-words">
              {r.students?.name} · {formatCurrency(Number(r.amount))}
            </p>

            {r.description && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">{financial.paymentHistoryDialog.descriptionLabel}</p>
                <p className="text-sm text-foreground break-words overflow-wrap-anywhere">
                  {r.description}
                </p>
              </div>
            )}

            {/* Comprovante de Pagamento */}
            {r.payment_proof_url && (
              <div className="rounded-lg border bg-primary/5 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {financial.paymentHistoryDialog.proofLabel}
                </p>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium break-words overflow-wrap-anywhere">
                      {r.payment_proof_filename || financial.paymentHistoryDialog.proofFilenameDefault}
                    </p>
                    <p className="text-xs text-muted-foreground break-words">
                      {financial.paymentHistoryDialog.sentAt}{" "}
                      {r.payment_proof_uploaded_at
                        ? formatDateTime(r.payment_proof_uploaded_at)
                        : "—"}
                    </p>
                    {r.payment_proof_status === "pending" && (
                      <p className="text-xs text-warning font-medium mt-1">
                        {financial.paymentHistoryDialog.proofPending}
                      </p>
                    )}
                    {r.payment_proof_status === "rejected" && (
                      <p className="text-xs text-destructive font-medium mt-1 break-words overflow-wrap-anywhere">
                        {financial.paymentHistoryDialog.proofRejected} {r.payment_proof_rejection_reason || common.labels.noReason}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleViewProof}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {financial.paymentHistoryDialog.view}
                  </Button>
                </div>

                {/* Aprovar / Rejeitar (só se pending) */}
                {r.payment_proof_status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      className="flex-1 bg-success text-white hover:bg-success/90"
                      onClick={handleApproveProof}
                    >
                      {financial.paymentHistoryDialog.approve}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={handleRejectProof}
                    >
                      {financial.paymentHistoryDialog.reject}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Status do pagamento */}
            {r.status === "pago" && r.confirmed_by ? (
              <div className="rounded-lg border bg-success/10 border-success/20 p-3 text-sm">
                {currentUserProfile?.role === "admin" ? (
                  <>
                    <p className="font-medium text-foreground break-words overflow-wrap-anywhere">
                      {financial.paymentHistoryDialog.confirmedBy} {r.confirmed_by.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {r.updated_at ? formatDateTime(r.updated_at) : financial.paymentHistoryDialog.dateUnavailable}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-foreground break-words">{financial.paymentHistoryDialog.paymentConfirmed}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {r.updated_at ? formatDateTime(r.updated_at) : financial.paymentHistoryDialog.dateUnavailable}
                    </p>
                  </>
                )}
              </div>
            ) : r.status === "pago" ? (
              <div className="rounded-lg border bg-success/10 border-success/20 p-3 text-sm">
                <p className="font-medium text-foreground break-words">{financial.paymentHistoryDialog.paymentConfirmed}</p>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">
                  {r.updated_at ? formatDateTime(r.updated_at) : financial.paymentHistoryDialog.dateUnavailable}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground break-words">
                  {financial.paymentHistoryDialog.noPayment}
                </p>
                {(!r.payment_proof_url || r.payment_proof_status === "rejected") && (
                  <Button
                    className="w-full bg-success text-white hover:bg-success/90"
                    onClick={() => {
                      onClose();
                      onConfirmPayment(record!);
                    }}
                  >
                    {financial.paymentHistoryDialog.confirmPaymentButton}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
