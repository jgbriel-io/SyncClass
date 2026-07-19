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
  info: "bg-accent text-accent-foreground border-accent",
};

// Status neutros (default) usam formato quadrado — só status que pedem atenção
// (success/warning/destructive/info) usam pill, reservando o formato arredondado
// para o que precisa se destacar visualmente.
const shapeStyles: Record<StatusVariant, string> = {
  success: "rounded-full",
  warning: "rounded-full",
  destructive: "rounded-full",
  info: "rounded-full",
  default: "rounded-md",
};

export function StatusBadge({
  variant,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border",
        shapeStyles[variant],
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
          variant === "info" && "bg-accent-foreground"
        )}
      />
      {children}
    </span>
  );
}
