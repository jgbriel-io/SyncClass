/**
 * Sistema de Logging Centralizado
 * 
 * Preparado para integração com Sentry/LogRocket
 * Captura contexto sem expor PII
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  componentName?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Manter últimos 100 logs em memória

  /**
   * Sanitiza dados sensíveis do contexto
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };

    // Remove PII do metadata
    if (sanitized.metadata) {
      const { email, cpf, phone, password, ...safeMeta } = sanitized.metadata as Record<string, unknown>;
      sanitized.metadata = safeMeta;
    }

    // Ofusca userId parcialmente (mantém apenas primeiros 4 chars)
    if (sanitized.userId && sanitized.userId.length > 4) {
      sanitized.userId = `${sanitized.userId.substring(0, 4)}****`;
    }

    return sanitized;
  }

  /**
   * Cria entrada de log
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      context: this.sanitizeContext(context),
      timestamp: new Date().toISOString(),
      error,
    };
  }

  /**
   * Armazena log em memória
   */
  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove o mais antigo
    }
  }

  /**
   * Envia log para serviço externo (Sentry/LogRocket)
   */
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // TODO: Integrar com Sentry/LogRocket
    // if (window.Sentry) {
    //   window.Sentry.captureException(entry.error, {
    //     level: entry.level,
    //     contexts: { custom: entry.context },
    //   });
    // }
    
    // Por enquanto, apenas armazena
    this.storeLog(entry);
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('debug', message, context);
    console.debug(`[DEBUG] ${message}`, entry.context);
    this.storeLog(entry);
  }

  /**
   * Log de informação
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, context);
    
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, entry.context);
    }
    
    this.storeLog(entry);
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('warn', message, context);
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, entry.context);
    }
    
    this.storeLog(entry);
    this.sendToExternalService(entry);
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, context, error);
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, entry.context);
    }
    
    this.storeLog(entry);
    this.sendToExternalService(entry);
  }

  /**
   * Captura erro de Error Boundary
   */
  captureErrorBoundary(error: Error, errorInfo: React.ErrorInfo, componentName: string): void {
    this.error(
      `Error Boundary capturou erro em ${componentName}`,
      error,
      {
        componentName,
        metadata: {
          componentStack: errorInfo.componentStack,
        },
      }
    );
  }

  /**
   * Captura erro de mutação do TanStack Query
   */
  captureMutationError(
    error: Error,
    mutationKey: string,
    variables?: unknown,
    context?: LogContext
  ): void {
    this.error(
      `Erro na mutação: ${mutationKey}`,
      error,
      {
        ...context,
        action: mutationKey,
        metadata: {
          variables: variables ? JSON.stringify(variables) : undefined,
        },
      }
    );
  }

  /**
   * Retorna logs armazenados (para debug)
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Limpa logs armazenados
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Exporta logs como JSON (para suporte)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instância singleton
export const logger = new Logger();

// Helpers para uso rápido
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context);
