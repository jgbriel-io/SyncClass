import * as Sentry from "@sentry/react";

// Sentry configuration
export function initSentry() {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE;

  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // Send default PII (Personally Identifiable Information)
    // This includes IP address, which helps identify error patterns by location
    sendDefaultPii: true,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // Adjust in production based on volume
    tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Capture Replay for 10% of all sessions
    // plus 100% of sessions with an error
    replaysSessionSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers (we keep IP via sendDefaultPii but remove auth tokens)
      if (event.request?.headers) {
        delete event.request.headers["Authorization"];
        delete event.request.headers["Cookie"];
      }

      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore ResizeObserver errors (common browser noise)
        if (error.message.includes("ResizeObserver")) {
          return null;
        }
        
        // Ignore cancelled requests
        if (error.message.includes("cancelled") || error.message.includes("aborted")) {
          return null;
        }
      }

      return event;
    },
  });
}

// Helper functions for manual logging
export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    Sentry.captureMessage(message, {
      level: "info",
      extra: context,
    });
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    Sentry.captureMessage(message, {
      level: "warning",
      extra: context,
    });
  },

  error: (error: Error | string, context?: Record<string, unknown>) => {
    if (typeof error === "string") {
      Sentry.captureMessage(error, {
        level: "error",
        extra: context,
      });
    } else {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  },

  // Set user context for better error tracking
  setUser: (user: { id: string; email?: string; role?: string }) => {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  },

  // Clear user context on logout
  clearUser: () => {
    Sentry.setUser(null);
  },

  // Add breadcrumb for tracking user actions
  addBreadcrumb: (message: string, category: string, data?: Record<string, unknown>) => {
    Sentry.addBreadcrumb({
      message,
      category,
      level: "info",
      data,
    });
  },
};
