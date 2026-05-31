import { cn } from "@/lib/utils";
import { ui } from "@/content";
import { LucideIcon } from "lucide-react";

const iconVariantStyles = {
  default: {
    container: "rounded-lg bg-accent",
    icon: "text-accent-foreground",
    value: "text-card-foreground",
  },
  primary: {
    container: "rounded-xl bg-primary/10",
    icon: "text-primary",
    value: "text-card-foreground",
  },
  primaryHighlight: {
    container: "rounded-xl bg-primary/10",
    icon: "text-primary",
    value: "text-primary",
  },
  success: {
    container: "rounded-xl bg-success/10",
    icon: "text-success",
    value: "text-success",
  },
  muted: {
    container: "rounded-xl bg-muted",
    icon: "text-muted-foreground",
    value: "text-muted-foreground",
  },
} as const;

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  /** Define cor do ícone e do valor (Total=primary, Ativos=success, Inativos=muted, Novos=primary) */
  variant?: keyof typeof iconVariantStyles;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  trend,
  className,
}: StatCardProps) {
  const styles = iconVariantStyles[variant];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-3 tablet:p-6 shadow-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 tablet:space-y-2 min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground leading-tight">
            {title}
          </p>
          <p
            className={cn(
              "text-xl tablet:text-2xl font-semibold tracking-tight",
              styles.value
            )}
          >
            {value}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-sm font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "+" : "-"}
              {Math.abs(trend.value)}%
              <span className="text-muted-foreground font-normal ml-1">
                {ui.comparison.vsPreviousMonth}
              </span>
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 tablet:h-11 tablet:w-11 items-center justify-center p-0 shrink-0",
              styles.container
            )}
          >
            <Icon
              className={cn("h-4 w-4 tablet:h-5 tablet:w-5", styles.icon)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
