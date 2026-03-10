import React from "react";
import ErrorBoundary, { ErrorBoundaryFallbackProps } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Fallback component para seções específicas (não full-page)
 * Usado para isolar erros em partes da aplicação
 */
function SectionErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-base">Erro ao carregar seção</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro ao carregar esta seção. Tente recarregar ou continue usando outras
          partes do sistema.
        </p>
        {import.meta.env.DEV && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium mb-2">
              Detalhes técnicos
            </summary>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={resetError} size="sm" variant="outline" className="gap-2">
          <RefreshCw className="h-3 w-3" />
          Recarregar seção
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Error Boundary para seções específicas da aplicação
 * Isola erros para não quebrar a aplicação inteira
 * 
 * @example
 * <SectionErrorBoundary>
 *   <FinancialView />
 * </SectionErrorBoundary>
 */
export function SectionErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary fallback={SectionErrorFallback}>{children}</ErrorBoundary>;
}

// eslint-disable-next-line react-refresh/only-export-components
export { withSectionErrorBoundary } from "./withSectionErrorBoundary";
