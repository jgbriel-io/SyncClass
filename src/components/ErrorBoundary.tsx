import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { common } from "@/content";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

// Default fallback component
function DefaultErrorFallback({
  error,
  resetError,
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{common.errors.errorBoundaryTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {common.errors.errorBoundaryMessage}
          </p>
          {import.meta.env.DEV && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                {common.errors.errorBoundaryTechnical}
              </summary>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                {error.message}
                {"\n\n"}
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={resetError} variant="default">
            {common.errors.errorBoundaryRetry}
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
          >
            {common.errors.errorBoundaryHome}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}

export { ErrorBoundary };
export default ErrorBoundary;
