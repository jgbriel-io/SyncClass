import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EmptyState - Estado vazio padronizado
 * 
 * Uso:
 * - Substituir divs manuais com py-10/py-12/py-6
 * - Garante espaçamento consistente
 * - Suporta ícone, título e mensagem
 * 
 * Exemplo:
 * <EmptyState
 *   icon={Users}
 *   title="Nenhum aluno cadastrado"
 *   message="Clique no botão acima para adicionar o primeiro aluno"
 * />
 */

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Ícone do Lucide a ser exibido
   */
  icon?: LucideIcon;
  /**
   * Título principal (negrito)
   */
  title?: string;
  /**
   * Mensagem secundária (texto mutado)
   */
  message?: string;
  /**
   * Ação customizada (ex: botão)
   */
  action?: React.ReactNode;
  /**
   * Tamanho vertical
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "py-6",
  default: "py-10",
  lg: "py-16",
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon: Icon,
      title,
      message,
      action,
      size = "default",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Espaçamento vertical padronizado
          sizeClasses[size],
          // Centralização
          "flex flex-col items-center justify-center text-center",
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            className="h-10 w-10 text-muted-foreground/50 mb-4"
            aria-hidden="true"
          />
        )}
        
        {title && (
          <h3 className="text-sm font-medium text-foreground mb-1">
            {title}
          </h3>
        )}
        
        {message && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {message}
          </p>
        )}
        
        {action && <div className="mt-4">{action}</div>}
        
        {children}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
