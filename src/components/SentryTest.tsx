/**
 * Componente de teste para validar integração com Sentry
 * 
 * IMPORTANTE: Este componente é apenas para desenvolvimento/testes
 * Remova ou desabilite em produção
 * 
 * Uso:
 * import SentryTest from "@/components/SentryTest";
 * <SentryTest />
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/sentry";
import * as Sentry from "@sentry/react";

export default function SentryTest() {
  const [throwError, setThrowError] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  if (throwError) {
    throw new Error("Teste de erro capturado pelo ErrorBoundary");
  }

  const testCaptureException = () => {
    try {
      throw new Error("Teste de exceção capturada manualmente");
    } catch (error) {
      logger.error(error as Error, {
        context: "SentryTest",
        testType: "captureException",
      });
    }
  };

  const testCaptureMessage = () => {
    logger.info("Mensagem de teste do Sentry", {
      context: "SentryTest",
      testType: "captureMessage",
    });
  };

  const testWarning = () => {
    logger.warn("Aviso de teste do Sentry", {
      context: "SentryTest",
      testType: "warning",
    });
  };

  const testBreadcrumbs = () => {
    logger.addBreadcrumb("Usuário clicou no botão de teste", "user-action", {
      button: "test-breadcrumbs",
    });
    logger.addBreadcrumb("Navegou para página de teste", "navigation", {
      from: "/",
      to: "/test",
    });
    logger.info("Breadcrumbs adicionados com sucesso");
  };

  const testErrorBoundary = () => {
    setThrowError(true);
  };

  const testSentryDialog = () => {
    const eventId = Sentry.captureMessage("Teste de feedback do usuário");
    Sentry.showReportDialog({ eventId });
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>🧪 Testes do Sentry</CardTitle>
        <CardDescription>
          Teste a integração do Sentry. Verifique o dashboard em{" "}
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            sentry.io
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={testCaptureException} variant="destructive">
          Testar Exceção
        </Button>
        <Button onClick={testCaptureMessage} variant="default">
          Testar Mensagem
        </Button>
        <Button onClick={testWarning} variant="secondary">
          Testar Aviso
        </Button>
        <Button onClick={testBreadcrumbs} variant="outline">
          Testar Breadcrumbs
        </Button>
        <Button onClick={testErrorBoundary} variant="destructive">
          Testar Error Boundary
        </Button>
        <Button onClick={testSentryDialog} variant="outline">
          Testar Dialog de Feedback
        </Button>
      </CardContent>
    </Card>
  );
}
