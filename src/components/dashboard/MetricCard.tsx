import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: MetricCardProps) {
  const isPositive = change && change >= 0;

  return (
    <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 tablet:space-y-2 min-w-0 flex-1">
          <p className="text-xs tablet:text-sm font-medium text-muted-foreground leading-tight">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-xl tablet:text-2xl font-bold tracking-tight">
              {value}
            </p>
            {change !== undefined && (
              <span
                className={cn(
                  "text-xs font-semibold tablet:hidden",
                  isPositive ? "text-success" : "text-destructive"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
            )}
          </div>
          {change !== undefined && (
            <div className="hidden tablet:flex items-center gap-1 flex-wrap">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-success shrink-0" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0",
            iconBg
          )}
        >
          <Icon className={cn("h-4 w-4 tablet:h-5 tablet:w-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}
