import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

/** Versioned ciphertext prefix — never store secrets without this envelope. */
export const SECRET_CIPHER_PREFIX = 'enc:v1:';

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

function resolveEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      'Missing ENCRYPTION_KEY — set a 32-byte key (64 hex chars or base64) in the server environment'
    );
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  try {
    const fromB64 = Buffer.from(raw, 'base64');
    if (fromB64.length === KEY_BYTES) {
      return fromB64;
    }
  } catch {
    // fall through
  }

  // Derive a stable 32-byte key from longer passphrases (dev convenience only).
  return createHash('sha256').update(raw, 'utf8').digest();
}

/**
 * Encrypt a secret for at-rest storage (AES-256-GCM).
 * Output is safe to put in user_metadata; without ENCRYPTION_KEY it cannot be read.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty secret');
  }
  const key = resolveEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]);
  return `${SECRET_CIPHER_PREFIX}${payload.toString('base64url')}`;
}

/**
 * Decrypt a secret. Supports legacy plaintext values (no prefix) for migration.
 */
export function decryptSecret(stored: string): string {
  if (!stored) {
    throw new Error('Cannot decrypt empty value');
  }
  if (!stored.startsWith(SECRET_CIPHER_PREFIX)) {
    return stored;
  }

  const key = resolveEncryptionKey();
  const payload = Buffer.from(
    stored.slice(SECRET_CIPHER_PREFIX.length),
    'base64url'
  );
  if (payload.length < IV_BYTES + TAG_BYTES + 1) {
    throw new Error('Invalid ciphertext');
  }

  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const encrypted = payload.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8'
  );
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(SECRET_CIPHER_PREFIX));
}

function normalizeBackupCode(code: string): string {
  return code.trim().toUpperCase();
}

/** One-way hash for backup codes (never store plaintext). */
export function hashBackupCode(code: string): string {
  return createHash('sha256')
    .update(normalizeBackupCode(code), 'utf8')
    .digest('hex');
}

export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(hashBackupCode);
}

/**
 * Constant-time match against hashed codes, with legacy plaintext fallback.
 */
export function matchAndConsumeBackupCode(
  token: string,
  storedCodes: string[]
): { matched: boolean; remaining: string[] } {
  const normalized = normalizeBackupCode(token);
  const tokenHash = hashBackupCode(normalized);
  const remaining: string[] = [];
  let matched = false;

  for (const stored of storedCodes) {
    if (matched) {
      remaining.push(stored);
      continue;
    }

    const isHash = /^[0-9a-f]{64}$/i.test(stored);
    if (isHash) {
      try {
        const a = Buffer.from(tokenHash, 'hex');
        const b = Buffer.from(stored, 'hex');
        if (a.length === b.length && timingSafeEqual(a, b)) {
          matched = true;
          continue;
        }
      } catch {
        // treat as non-match
      }
      remaining.push(stored);
      continue;
    }

    // Legacy plaintext backup code — consume and leave remaining as hashes where possible
    if (normalizeBackupCode(stored) === normalized) {
      matched = true;
      continue;
    }
    remaining.push(stored);
  }

  return { matched, remaining };
}

export function hasEncryptionKeyConfigured(): boolean {
  return Boolean(process.env.ENCRYPTION_KEY?.trim());
}
