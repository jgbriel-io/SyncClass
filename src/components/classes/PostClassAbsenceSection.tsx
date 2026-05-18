import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { STACK, GAP } from "@/lib/design-tokens/spacing";
import { TYPOGRAPHY } from "@/lib/design-tokens/typography";
import { classes as classesContent } from "@/content";

interface PostClassAbsenceSectionProps {
  chargeAbsence: boolean;
  refundPayment: boolean;
  isPaymentAlreadyPaid: boolean;
  onChargeAbsenceChange: (checked: boolean) => void;
  onRefundPaymentChange: (checked: boolean) => void;
}

export function PostClassAbsenceSection({
  chargeAbsence,
  refundPayment,
  isPaymentAlreadyPaid,
  onChargeAbsenceChange,
  onRefundPaymentChange,
}: PostClassAbsenceSectionProps) {
  return (
    <div className={`${STACK.TIGHT} p-3 bg-muted/50 rounded-lg border`}>
      <div className={`flex items-start ${GAP.TIGHT}`}>
        <Checkbox
          id="chargeAbsence"
          checked={chargeAbsence}
          onCheckedChange={(checked) => onChargeAbsenceChange(!!checked)}
        />
        <div className="flex-1">
          <Label htmlFor="chargeAbsence" className="cursor-pointer font-medium">
            {classesContent.postClassDialog.chargeAbsenceLabel}
          </Label>
          <p className={`${TYPOGRAPHY.SMALL} mt-1`}>
            {chargeAbsence 
              ? "A cobrança será mantida com o status atual"
              : isPaymentAlreadyPaid
                ? "A cobrança será mantida como paga (ou extornada se marcar abaixo)"
                : "A cobrança será marcada como abonada (não cobrada)"}
          </p>
        </div>
      </div>
      
      {!chargeAbsence && isPaymentAlreadyPaid && (
        <div className={`flex items-start ${GAP.TIGHT} ml-6 pt-2 border-t`}>
          <Checkbox
            id="refundPayment"
            checked={refundPayment}
            onCheckedChange={(checked) => onRefundPaymentChange(!!checked)}
          />
          <div className="flex-1">
            <Label htmlFor="refundPayment" className="cursor-pointer font-medium text-amber-600">
              {classesContent.postClassDialog.refundLabel}
            </Label>
            <p className={`${TYPOGRAPHY.SMALL} mt-1`}>
              {classesContent.postClassDialog.refundDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
