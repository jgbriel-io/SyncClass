import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/formatters";
import { REGEX_PATTERNS } from "@/lib/utils/patterns";
import { brDateToIso, buildTimestamptzFromDateAndTime as buildTimestamptz } from "@/lib/utils/classFormHelpers";
import type { Slot } from "./PackageSlotList";

interface PackageFinancialSectionProps {
  slots: Slot[];
  hourlyRate: number | null;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
}

export function PackageFinancialSection({
  slots,
  hourlyRate,
  paymentMethod,
  onPaymentMethodChange,
}: PackageFinancialSectionProps) {
  const rate = hourlyRate ?? 0;

  const total = slots.reduce((sum, s) => {
    if (
      !s.class_date ||
      !s.start_time ||
      !s.end_time ||
      !REGEX_PATTERNS.time.test(s.start_time) ||
      !REGEX_PATTERNS.time.test(s.end_time)
    )
      return sum;
    const classDateIso = brDateToIso(s.class_date);
    const startAt = buildTimestamptz(classDateIso, s.start_time);
    const endAt = buildTimestamptz(classDateIso, s.end_time);
    const min = Math.round(
      (new Date(endAt).getTime() - new Date(startAt).getTime()) / (60 * 1000)
    );
    return sum + (rate > 0 && min > 0 ? rate * (min / 60) : 0);
  }, 0);

  const validSlots = slots.filter(
    (s) =>
      s.class_date &&
      REGEX_PATTERNS.time.test(s.start_time || "") &&
      REGEX_PATTERNS.time.test(s.end_time || "")
  );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Valor total do pacote: {total > 0 ? formatCurrency(total) : "—"} ({validSlots.length}{" "}
        aula(s))
      </p>
      {rate <= 0 && (
        <p className="text-xs text-amber-600">
          Aluno sem valor/hora cadastrado. Cadastre no perfil do aluno.
        </p>
      )}
      <div className="space-y-1.5">
        <Label>Método de pagamento *</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="cartao">Cartão</SelectItem>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="transferencia">Transferência</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
