import { IMPORT_INSERT_CONCURRENCY } from '@/lib/import/constants';
import {
  normalizeImportRow,
  type NormalizeFailure,
  type RawImportRow,
} from '@/lib/import/lead-normalizer';
import { submitLead, type LeadInput } from '@/lib/leads';
import type { ValidatedLead } from '@/lib/validation/lead-schema';

export interface ImportRowError {
  rowNumber: number;
  message: string;
  reason: NormalizeFailure['reason'] | 'insert_failed';
}

export interface ImportLeadsSummary {
  totalRows: number;
  created: number;
  duplicates: number;
  skipped: number;
  failed: number;
  errors: ImportRowError[];
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current], current);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker()
  );
  await Promise.all(runners);
  return results;
}

/**
 * Normalize Excel rows, dedupe by maps_url within the file, then insert for owner.
 */
export async function importValidatedLeads(
  rows: RawImportRow[],
  options: {
    ownerId: string;
    nicheDefault?: string;
    countryDefault?: string;
  }
): Promise<ImportLeadsSummary> {
  const errors: ImportRowError[] = [];
  const leads: Array<{ lead: ValidatedLead; rowNumber: number }> = [];
  const seenMaps = new Set<string>();
  let skipped = 0;
  let intraFileDuplicates = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const result = normalizeImportRow(row, rowNumber, {
      niche: options?.nicheDefault,
      country: options?.countryDefault,
    });

    if (!result.ok) {
      skipped += 1;
      if (errors.length < 50) {
        errors.push({
          rowNumber: result.rowNumber,
          message: result.message,
          reason: result.reason,
        });
      }
      return;
    }

    const mapsKey = result.lead.maps_url.toLowerCase();
    if (seenMaps.has(mapsKey)) {
      intraFileDuplicates += 1;
      return;
    }

    seenMaps.add(mapsKey);
    leads.push({ lead: result.lead, rowNumber });
  });

  let created = 0;
  let duplicates = intraFileDuplicates;
  let failed = 0;

  const insertResults = await mapWithConcurrency(
    leads,
    IMPORT_INSERT_CONCURRENCY,
    async ({ lead, rowNumber }) => {
      const payload: LeadInput = {
        name: lead.name,
        niche: lead.niche,
        country: lead.country,
        maps_url: lead.maps_url,
        phone: lead.phone,
        address: lead.address,
        owner_id: options.ownerId,
      };

      try {
        return { rowNumber, result: await submitLead(payload) };
      } catch (error) {
        return {
          rowNumber,
          result: {
            kind: 'caught_error' as const,
            message:
              error instanceof Error ? error.message : 'Insert failed',
          },
        };
      }
    }
  );

  for (const item of insertResults) {
    if (item.result.kind === 'created') {
      created += 1;
    } else if (item.result.kind === 'duplicate') {
      duplicates += 1;
    } else {
      failed += 1;
      if (errors.length < 50) {
        const message =
          item.result.kind === 'caught_error'
            ? item.result.message
            : item.result.error.message;
        errors.push({
          rowNumber: item.rowNumber,
          message,
          reason: 'insert_failed',
        });
      }
    }
  }

  return {
    totalRows: rows.length,
    created,
    duplicates,
    skipped,
    failed,
    errors,
  };
}
