import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";

interface NumericCellProps {
  value: number | null | undefined;
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
  emptyText?: string;
}

export function NumericCell({ 
  value, 
  format = 'number',
  className,
  emptyText = '—'
}: NumericCellProps) {
  if (value == null) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {emptyText}
      </span>
    );
  }
  
  let formatted: string;
  switch (format) {
    case 'currency':
      formatted = formatCurrency(value);
      break;
    case 'percentage':
      formatted = `${value.toFixed(1)}%`;
      break;
    default:
      formatted = String(value);
  }
  
  return (
    <span 
      className={cn("text-xs font-medium tabular-nums", className)}
      title={formatted}
    >
      {formatted}
    </span>
  );
}
