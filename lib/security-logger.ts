export enum SecurityEventType {
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  MFA_SETUP = 'MFA_SETUP',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_FAILURE = 'MFA_FAILURE',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALIDATED = 'SESSION_INVALIDATED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  DATA_ACCESS_DENIED = 'DATA_ACCESS_DENIED',
  LEAD_SUBMISSION = 'LEAD_SUBMISSION',
  LEAD_DUPLICATE = 'LEAD_DUPLICATE',
  LEAD_ERROR = 'LEAD_ERROR',
  LEAD_IMPORT = 'LEAD_IMPORT',
  LEAD_IMPORT_DENIED = 'LEAD_IMPORT_DENIED',
}

interface SecurityLogDetails {
  requestId?: string;
  ip?: string;
  userAgent?: string | null;
  path?: string;
  message?: string;
  [key: string]: unknown;
}

export class SecurityLogger {
  static log(
    event: SecurityEventType,
    details: SecurityLogDetails = {},
    ip?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: ip ?? details.ip,
    };

    if (process.env.NODE_ENV === 'production') {
      console.error('SECURITY_EVENT', logEntry);
      return;
    }

    console.warn('Security Event:', logEntry);
  }
}
