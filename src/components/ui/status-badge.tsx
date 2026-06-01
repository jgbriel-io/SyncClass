import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "destructive" | "default" | "info";

interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning border-warning/20",
  destructive: "bg-destructive-muted text-destructive border-destructive/20",
  default: "bg-muted text-muted-foreground border-border",
  info: "bg-blue-50 text-blue-600 border-blue-200",
};

export function StatusBadge({
  variant,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
        variantStyles[variant],
        // justify-center como padrão, mas permite override via className
        !className?.includes("justify-") && "justify-center",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          variant === "success" && "bg-success",
          variant === "warning" && "bg-warning",
          variant === "destructive" && "bg-destructive",
          variant === "default" && "bg-muted-foreground",
          variant === "info" && "bg-blue-500"
        )}
      />
      {children}
    </span>
  );
}
