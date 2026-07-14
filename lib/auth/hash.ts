import { createHash } from 'crypto';

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
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

  const candidate = hashApiKey(apiKey);
  return hashes.includes(candidate);
}
