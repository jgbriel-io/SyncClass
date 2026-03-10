import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /**
   * Ícone do Lucide React
   */
  icon?: LucideIcon;
  /**
   * Título do estado vazio
   */
  title?: string;
  /**
   * Mensagem descritiva
   */
  message: string;
  /**
   * Texto do botão de ação (opcional)
   */
  actionLabel?: string;
  /**
   * Callback ao clicar no botão
   */
  onAction?: () => void;
  /**
   * Tamanho do componente
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Ilustração SVG customizada (opcional)
   */
  illustration?: React.ReactNode;
}

const sizeClasses = {
  sm: {
    container: "py-6",
    icon: "h-8 w-8",
    title: "text-base",
    message: "text-xs",
  },
  default: {
    container: "py-12",
    icon: "h-12 w-12",
    title: "text-lg",
    message: "text-sm",
  },
  lg: {
    container: "py-16",
    icon: "h-16 w-16",
    title: "text-xl",
    message: "text-base",
  },
};

/**
 * Componente de Empty State melhorado
 * 
 * Mostra uma mensagem quando não há dados para exibir,
 * com opção de ícone, ilustração customizada e CTA.
 */
export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  size = "default",
  illustration,
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", sizes.container)}>
      {/* Ilustração ou Ícone */}
      {illustration ? (
        <div className="mb-4">{illustration}</div>
      ) : Icon ? (
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <Icon className={cn("text-muted-foreground", sizes.icon)} />
        </div>
      ) : null}

      {/* Título (opcional) */}
      {title && (
        <h3 className={cn("font-semibold text-foreground mb-2", sizes.title)}>
          {title}
        </h3>
      )}

      {/* Mensagem */}
      <p className={cn("text-muted-foreground max-w-md", sizes.message)}>
        {message}
      </p>

      {/* CTA (opcional) */}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6" size={size === "sm" ? "sm" : "default"}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
