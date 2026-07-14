import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

export const DEMO_SAMPLE_SIZE = 100;

/**
 * Returns curated demo lead IDs (max 100). Empty if none seeded yet.
 */
export async function getDemoSampleLeadIds(
  supabase: SupabaseClient<Database>
): Promise<number[]> {
  const { data, error } = await supabase
    .from('demo_sample_leads')
    .select('lead_id')
    .limit(DEMO_SAMPLE_SIZE);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => row.lead_id)
    .filter((id): id is number => typeof id === 'number');
}
