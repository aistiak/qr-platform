/**
 * Logging utility for critical operations
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOGGING === 'true') {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Specialized loggers for critical operations
  auth(message: string, context?: LogContext) {
    this.info(`[AUTH] ${message}`, { ...context, category: 'authentication' });
  }

  qrCode(message: string, context?: LogContext) {
    this.info(`[QR_CODE] ${message}`, { ...context, category: 'qr_code' });
  }

  admin(message: string, context?: LogContext) {
    this.info(`[ADMIN] ${message}`, { ...context, category: 'admin' });
  }
}

export const logger = new Logger();
