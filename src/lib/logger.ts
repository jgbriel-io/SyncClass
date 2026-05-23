export const logger = {
  error: (error: Error | unknown, context?: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.error(error, context);
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

  // no-ops: mantêm chamadas de contexto de auth sem Sentry
  setUser: (_user: { id: string; email?: string; role?: string }) => {},
  clearUser: () => {},
  addBreadcrumb: (
    _message: string,
    _category?: string,
    _data?: Record<string, unknown>
  ) => {},
};
