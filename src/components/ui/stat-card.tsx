import { cn } from "@/lib/utils";
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
        "relative overflow-hidden rounded-lg border bg-card p-6 shadow-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-semibold tracking-tight", styles.value)}>
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
                vs mês anterior
              </span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("flex h-11 w-11 items-center justify-center p-0", styles.container)}>
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>
        )}
      </div>
    </div>
  );
}
