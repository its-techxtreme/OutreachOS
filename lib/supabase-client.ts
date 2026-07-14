import type { SupabaseClient } from '@supabase/supabase-js';

import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import type { Database } from '@/types/database.types';

/**
 * Browser Supabase client singleton.
 * Delegates to the SSR cookie-aware client so auth and realtime share one GoTrue instance.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  return createBrowserSupabaseClient();
}

export function leadsTable() {
  return getSupabaseClient().from('leads');
}
