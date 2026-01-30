import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  variant?: "default" | "success" | "warning" | "destructive";
  onClick?: () => void;
}

const variantColors = {
  default: {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
  },
  destructive: {
    bg: "bg-destructive/10",
    text: "text-destructive",
  },
};

export function StudentMetricCard({
  icon: Icon,
  label,
  value,
  description,
  variant = "default",
  onClick,
}: StudentMetricCardProps) {
  const colors = variantColors[variant];

  return (
    <Card
      className={cn(
        "p-6 transition-all",
        onClick && "cursor-pointer hover:shadow-md active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Ícone */}
        <div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0",
            colors.bg
          )}
        >
          <Icon className={cn("h-6 w-6", colors.text)} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
