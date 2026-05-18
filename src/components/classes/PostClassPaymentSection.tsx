import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { getActivityFileUrl } from "@/hooks/useActivities";
import { STACK, GAP } from "@/lib/design-tokens/spacing";
import { ICON_SIZES } from "@/lib/design-tokens/icon-sizes";
import { TYPOGRAPHY } from "@/lib/design-tokens/typography";
import { classes as classesContent } from "@/content";
import { useState } from "react";

interface PostClassPaymentSectionProps {
  confirmPayment: boolean;
  isPaymentAlreadyPaid: boolean;
  hasPaymentProof: boolean;
  paymentProofUrl?: string;
  paymentProofFilename?: string;
  paymentProofStatus?: string;
  onConfirmPaymentChange: (checked: boolean) => void;
  errorMessage?: string;
}

export function PostClassPaymentSection({
  confirmPayment,
  isPaymentAlreadyPaid,
  hasPaymentProof,
  paymentProofUrl,
  paymentProofFilename = "Comprovante",
  paymentProofStatus,
  onConfirmPaymentChange,
  errorMessage,
}: PostClassPaymentSectionProps) {
  const [isViewingProof, setIsViewingProof] = useState(false);

  const handleViewProof = async () => {
    if (!paymentProofUrl) return;
    
    setIsViewingProof(true);
    try {
      const url = await getActivityFileUrl(paymentProofUrl);
      window.open(url, "_blank");
    } catch (error) {
      toast.error(classesContent.postClassDialog.toasts.proofOpenError);
    } finally {
      setIsViewingProof(false);
    }
  };

  return (
    <div className={STACK.TIGHT}>
      <div className={`flex items-center ${GAP.TIGHT}`}>
        <Checkbox
          id="confirmPayment"
          checked={confirmPayment}
          disabled={isPaymentAlreadyPaid}
          onCheckedChange={(checked) => onConfirmPaymentChange(!!checked)}
        />
        <Label
          htmlFor="confirmPayment"
          className={isPaymentAlreadyPaid ? "cursor-default text-muted-foreground" : "cursor-pointer"}
        >
          {classesContent.postClassDialog.confirmPaymentLabel}
        </Label>
      </div>
      {errorMessage && (
        <p className={`${TYPOGRAPHY.BODY} text-destructive`}>{errorMessage}</p>
      )}
      
      {hasPaymentProof && (
        <div className={`flex items-center ${GAP.TIGHT} rounded-lg border bg-muted/30 p-3`}>
          <FileText className={`${ICON_SIZES.SM} text-muted-foreground flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className={`${TYPOGRAPHY.BODY} font-medium truncate`}>{paymentProofFilename}</p>
            <p className={TYPOGRAPHY.SMALL}>
              {paymentProofStatus === "pending" && classesContent.postClassDialog.proofPending}
              {paymentProofStatus === "approved" && classesContent.postClassDialog.proofApproved}
              {paymentProofStatus === "rejected" && classesContent.postClassDialog.proofRejected}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleViewProof}
            disabled={isViewingProof}
            className="flex-shrink-0"
          >
            {isViewingProof ? (
              <Loader2 className={`${ICON_SIZES.SM} animate-spin`} />
            ) : (
              <>
                <Eye className={`${ICON_SIZES.SM} mr-1`} />
                {classesContent.postClassDialog.viewProof}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
