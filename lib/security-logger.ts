/**
 * Security event logging — event codes only, no secrets/passwords in the payload.
 * User passwords never belong here (Supabase Auth owns those).
 */

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

const SAFE_DETAIL_KEYS = new Set([
  'requestId',
  'ip',
  'userAgent',
  'path',
  'message',
  'userId',
  'reason',
  'statusCode',
]);

function publicDetails(details: SecurityLogDetails): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (!SAFE_DETAIL_KEYS.has(key)) continue;
    if (typeof value === 'string') {
      out[key] = value.slice(0, 200);
      continue;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
      out[key] = value;
    }
  }
  return out;
}

export class SecurityLogger {
  static log(
    event: SecurityEventType,
    details: SecurityLogDetails = {},
    ip?: string
  ): void {
    // Log a code + safe metadata only — never tokens, passwords, or raw API keys
    const line = {
      timestamp: new Date().toISOString(),
      event: String(event),
      details: publicDetails(details),
      ip: ip ?? details.ip,
    };

    if (process.env.NODE_ENV === 'production') {
      console.error('SECURITY_EVENT', JSON.stringify(line));
      return;
    }

    console.warn('Security Event:', JSON.stringify(line));
  }
}
