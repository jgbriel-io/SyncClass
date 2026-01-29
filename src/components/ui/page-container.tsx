import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageContainer - Container padronizado para conteúdo de páginas
 * 
 * Uso:
 * - Substituir `<main className="p-4 lg:p-6">` por `<PageContainer>`
 * - Garante padding consistente em todas as páginas
 * - Suporta max-width para evitar linhas muito longas
 */

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Limitar largura máxima do conteúdo
   * @default false
   */
  constrained?: boolean;
  /**
   * Largura máxima quando constrained=true
   * @default "7xl"
   */
  maxWidth?: "5xl" | "6xl" | "7xl" | "full";
}

const maxWidthClasses = {
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  "full": "max-w-full",
};

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, constrained = false, maxWidth = "7xl", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Padding padronizado responsivo
          "p-4 lg:p-6",
          // Animação fade-in consistente
          "animate-fade-in",
          // Constraint opcional
          constrained && ["mx-auto", maxWidthClasses[maxWidth]],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PageContainer.displayName = "PageContainer";
