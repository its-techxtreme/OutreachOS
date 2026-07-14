type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string | null;
  duration?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'token',
  'authorization',
  'x-agent-secret',
  'api_key',
  'apikey',
  'key_hash',
]);

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();

    if (
      SENSITIVE_KEYS.has(lowerKey) ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password')
    ) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = `${value.slice(0, 500)}…`;
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

class OutreachOSLogger {
  private shouldLog(level: LogLevel): boolean {
    const configured = (process.env.LOG_LEVEL ?? 'info') as LogLevel;
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(configured);
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'outreachos-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      ...sanitizeContext(context),
    };

    const serialized = JSON.stringify(entry);

    if (level === 'error') {
      console.error(serialized);
      return;
    }

    if (level === 'warn') {
      console.warn(serialized);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`);
      if (context && Object.keys(context).length > 0) {
        console.log(sanitizeContext(context));
      }
      return;
    }

    console.log(serialized);
  }

  debug(message: string, context?: LogContext): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.write('error', message, context);
  }

  logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info('API request completed', {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    context?: LogContext
  ): void {
    this.info('Database operation', {
      operation,
      table,
      duration,
      success,
      ...context,
    });
  }
}

export const logger = new OutreachOSLogger();
