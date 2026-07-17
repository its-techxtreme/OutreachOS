import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  // In the browser, use the SSR cookie-aware client so proxy + client auth stay in sync.
  // In Node (Jest), fall back to the standard client.
  browserClient =
    typeof window === 'undefined'
      ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
            // Single owner of refresh — do not add a second refresh loop.
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        });

  return browserClient;
}
