/**
 * Simple logger utility to replace Sentry logger
 * Logs to console in development, silent in production
 */

export const logger = {
  error: (message: string, context?: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.error(message, context);
    }
  },
  
  warn: (message: string, context?: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.warn(message, context);
    }
  },
  
  info: (message: string, context?: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.info(message, context);
    }
  },
  
  debug: (message: string, context?: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.debug(message, context);
    }
  },
};
