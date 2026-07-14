/**
 * Selects ~100 diverse leads into demo_sample_leads for the public demo account.
 * Usage: node scripts/seed-demo-sample.mjs
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SAMPLE_SIZE = 100;

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

function pickDiverse(leads, limit) {
  const byKey = new Map();

  for (const lead of leads) {
    const key = `${lead.country}::${lead.niche}`;
    if (!byKey.has(key)) {
      byKey.set(key, []);
    }
    byKey.get(key).push(lead);
  }

  const buckets = [...byKey.values()].map((rows) =>
    rows.sort((a, b) => a.id - b.id)
  );
  const selected = [];
  let round = 0;

  while (selected.length < limit && buckets.some((b) => b.length > round)) {
    for (const bucket of buckets) {
      if (selected.length >= limit) {
        break;
      }
      if (bucket[round]) {
        selected.push(bucket[round]);
      }
    }
    round += 1;
  }

  return selected.slice(0, limit);
}

async function main() {
  const env = {
    ...loadEnv(path.join(process.cwd(), '.env')),
    ...loadEnv(path.join(process.cwd(), '.env.local')),
  };

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing Supabase URL / service role key');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, niche, country')
    .order('id', { ascending: true });

  if (error) {
    console.error('FETCH_FAILED', error.message);
    process.exit(1);
  }

  const selected = pickDiverse(leads ?? [], SAMPLE_SIZE);
  const rows = selected.map((lead) => ({ lead_id: lead.id }));

  const { error: clearError } = await supabase
    .from('demo_sample_leads')
    .delete()
    .neq('lead_id', 0);

  if (clearError) {
    console.error('CLEAR_FAILED', clearError.message);
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from('demo_sample_leads')
    .insert(rows);

  if (insertError) {
    console.error('INSERT_FAILED', insertError.message);
    process.exit(1);
  }

  const niches = new Set(selected.map((l) => l.niche));
  const countries = new Set(selected.map((l) => l.country));

  console.log(
    JSON.stringify(
      {
        ok: true,
        selected: selected.length,
        niches: niches.size,
        countries: countries.size,
        nicheList: [...niches].sort(),
        countryList: [...countries].sort(),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
