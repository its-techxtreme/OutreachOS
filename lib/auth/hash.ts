import { scryptSync, timingSafeEqual } from 'crypto';

/**
 * Hash API keys for comparison (env lists plaintext keys; we hash at runtime).
 * User passwords are handled by Supabase Auth — this is not a password hasher.
 * scrypt keeps CodeQL happy and is slow enough for key verification.
 */
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LEN = 32;

function apiKeySalt(): Buffer {
  const raw =
    process.env.API_KEY_HASH_SALT?.trim() ||
    process.env.ENCRYPTION_KEY?.trim() ||
    'outreachos-api-key-v1';
  return Buffer.from(raw, 'utf8');
}

export function hashApiKey(apiKey: string): string {
  return scryptSync(apiKey, apiKeySalt(), KEY_LEN, SCRYPT_PARAMS).toString('hex');
}

export function getConfiguredApiKeyHashes(): string[] {
  const raw = process.env.API_KEYS ?? '';
  return raw
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
    .map(hashApiKey);
}

export function isValidApiKey(apiKey: string): boolean {
  const hashes = getConfiguredApiKeyHashes();
  if (hashes.length === 0) {
    return false;
  }

  let candidate: Buffer;
  try {
    candidate = Buffer.from(hashApiKey(apiKey), 'hex');
  } catch {
    return false;
  }

  return hashes.some((hash) => {
    try {
      const expected = Buffer.from(hash, 'hex');
      return expected.length === candidate.length && timingSafeEqual(expected, candidate);
    } catch {
      return false;
    }
  });
}
