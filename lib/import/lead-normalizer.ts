import { LeadSchema, type ValidatedLead } from '@/lib/validation/lead-schema';

export interface RawImportRow {
  [key: string]: unknown;
}

export type NormalizeSkipReason =
  | 'missing_name'
  | 'final_status_excluded'
  | 'validation_failed';

export interface NormalizeSuccess {
  ok: true;
  lead: ValidatedLead;
}

export interface NormalizeFailure {
  ok: false;
  reason: NormalizeSkipReason;
  message: string;
  rowNumber: number;
}

export type NormalizeResult = NormalizeSuccess | NormalizeFailure;

const EMPTY_TOKENS = new Set(['NULL', 'N/A', 'NA', 'NONE', '-', '']);

const NAME_KEYS = [
  'business name',
  'business_name',
  'company name',
  'company',
  'name',
  'lead name',
];

const NICHE_KEYS = ['niche', 'category', 'industry', 'vertical'];

const COUNTRY_KEYS = ['country', 'nation', 'region'];

const ADDRESS_KEYS = ['address', 'full address', 'location', 'street'];

const PHONE_KEYS = [
  'phone number',
  'phone',
  'primary mobile',
  'mobile no. (verified)',
  'mobile',
  'mobile number',
  'tel',
];

const MAPS_KEYS = [
  'google maps link',
  'google maps url',
  'maps_url',
  'maps url',
  'maps link',
  'source url',
  'google maps',
];

const FINAL_STATUS_KEYS = ['final status', 'status filter', 'import status'];

const REJECT_STATUSES = new Set(['REJECT', 'SKIP', 'NO', 'EXCLUDE', 'N']);

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getByAliases(
  row: RawImportRow,
  aliases: string[]
): unknown {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeHeader(key),
    value,
  ] as const);

  for (const alias of aliases) {
    const match = normalizedEntries.find(([key]) => key === alias);
    if (match && match[1] !== undefined && match[1] !== null) {
      return match[1];
    }
  }

  return undefined;
}

/** Neutralize spreadsheet formula injection when values are later exported. */
export function neutralizeFormula(value: string): string {
  // International phone numbers (+digits) are not Excel formulas
  if (/^\+\d/.test(value)) {
    return value;
  }

  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }

  return value;
}

export function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = neutralizeFormula(String(value).trim());
  if (!text || EMPTY_TOKENS.has(text.toUpperCase())) {
    return null;
  }

  return text;
}

export function cleanPhone(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  const digits = text.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91 ${digits}`;
  }

  return text.slice(0, 50);
}

export function mapsSearchUrl(
  name: string,
  address: string | null,
  country: string | null
): string {
  const parts = [name, address ?? '', country ?? ''].filter(Boolean);
  const query = encodeURIComponent(parts.join(' '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function isGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host === 'maps.google.com' || host === 'maps.app.goo.gl') {
      return true;
    }

    if (host.includes('google.') && path.includes('/maps')) {
      return true;
    }

    return host.endsWith('goo.gl') && path.length > 1;
  } catch {
    return false;
  }
}

function resolveMapsUrl(
  rawMaps: string | null,
  name: string,
  address: string | null,
  country: string | null
): string {
  if (rawMaps && isGoogleMapsUrl(rawMaps)) {
    return rawMaps.slice(0, 2000);
  }

  // Social / non-maps Source URL → synthesize a maps search URL
  return mapsSearchUrl(name, address, country);
}

/**
 * Maps a loose Excel row into a validated lead, mirroring scripts/import-client-leads.py.
 */
export function normalizeImportRow(
  raw: RawImportRow,
  rowNumber: number,
  defaults?: { niche?: string; country?: string }
): NormalizeResult {
  const name = cleanText(getByAliases(raw, NAME_KEYS));
  if (!name) {
    return {
      ok: false,
      reason: 'missing_name',
      message: 'Missing business name',
      rowNumber,
    };
  }

  const finalStatus = cleanText(getByAliases(raw, FINAL_STATUS_KEYS));
  if (finalStatus && REJECT_STATUSES.has(finalStatus.toUpperCase())) {
    return {
      ok: false,
      reason: 'final_status_excluded',
      message: `Excluded by Final Status: ${finalStatus}`,
      rowNumber,
    };
  }

  const niche =
    cleanText(getByAliases(raw, NICHE_KEYS)) ?? defaults?.niche ?? 'General';
  const country =
    cleanText(getByAliases(raw, COUNTRY_KEYS)) ??
    defaults?.country ??
    'Unknown';
  const address = cleanText(getByAliases(raw, ADDRESS_KEYS));
  const phone = cleanPhone(getByAliases(raw, PHONE_KEYS));
  const rawMaps = cleanText(getByAliases(raw, MAPS_KEYS));
  const mapsUrl = resolveMapsUrl(rawMaps, name, address, country);

  const parsed = LeadSchema.safeParse({
    name: name.slice(0, 255),
    niche: niche.slice(0, 100),
    country: country.slice(0, 100),
    phone: phone ?? undefined,
    address: address ? address.slice(0, 500) : undefined,
    maps_url: mapsUrl.slice(0, 2000),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      reason: 'validation_failed',
      message: first?.message ?? 'Validation failed',
      rowNumber,
    };
  }

  return { ok: true, lead: parsed.data };
}
