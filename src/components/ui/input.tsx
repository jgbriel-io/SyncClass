import * as React from "react";

import { cn } from "@/lib/utils";
import { extractDigits, removeLeadingZeros } from "@/lib/utils/patterns";

// Função para formatar automaticamente para valor monetário (ex: 123 -> 123,00)
function autoFormatNumber(
  e: React.ChangeEvent<HTMLInputElement>,
  originalOnChange?: React.ChangeEventHandler<HTMLInputElement>,
) {
  let value = extractDigits(e.target.value);
  if (!value) value = "0";
  value = removeLeadingZeros(value);
  let formatted = value;
  if (value.length > 2) {
    formatted = value.slice(0, value.length - 2) + "," + value.slice(-2);
  } else if (value.length === 2) {
    formatted = "0," + value;
  } else if (value.length === 1) {
    formatted = "0,0" + value;
  }
  e.target.value = formatted;
  if (originalOnChange) originalOnChange(e);
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, ...props }, ref) => {
    // Função para formatar automaticamente para dd/mm/aaaa
    function autoFormatDate(e: React.ChangeEvent<HTMLInputElement>) {
      let value = extractDigits(e.target.value);
      if (value.length > 8) value = value.slice(0, 8);
      let formatted = value;
      if (value.length > 4) {
        formatted = value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4);
      } else if (value.length > 2) {
        formatted = value.slice(0, 2) + "/" + value.slice(2);
      }
      e.target.value = formatted;
      if (onChange) onChange(e);
    }

    // Detecta se é campo de data customizado
    const isDateText = type === 'text' && (props['inputMode'] === 'numeric' && (props['pattern'] === "^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\\d{4}$" || props['pattern'] === "^\\d{2}/\\d{2}/\\d{4}$"));

    // Detecta se é campo de valor numérico (apenas para ids e names comuns de valor)
    const isNumberValue = type === 'text' && (
      ['amount', 'financial_amount', 'valor', 'preco', 'price', 'mensalidade', 'pagamento'].some(
        k => (props['id'] || '').toLowerCase().includes(k) || (props['name'] || '').toLowerCase().includes(k)
      )
    );

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onChange={isDateText
          ? autoFormatDate
          : isNumberValue
          ? (e) => autoFormatNumber(e, onChange)
          : onChange}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
