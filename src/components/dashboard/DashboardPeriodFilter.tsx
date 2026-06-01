import { cn } from "@/lib/utils";
import { type PeriodFilter } from "@/lib/utils/periodFilter";
import { dashboard } from "@/content";

interface DashboardPeriodFilterProps {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
}

const OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "month", label: dashboard.periodFilter.month },
  { value: "semester", label: dashboard.periodFilter.semester },
  { value: "year", label: dashboard.periodFilter.year },
];

export function DashboardPeriodFilter({
  value,
  onChange,
}: DashboardPeriodFilterProps) {
  return (
    <div className="flex items-center rounded-md border bg-background p-0.5 gap-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 h-7 text-xs font-medium rounded-sm transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
