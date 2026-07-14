import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { getEnvVar } from './env';
import type { Database } from '@/types/database.types';

let serverClientInstance: SupabaseClient<Database> | null = null;

export function getSupabaseServer(): SupabaseClient<Database> {
  if (serverClientInstance) {
    return serverClientInstance;
  }

  serverClientInstance = createClient<Database>(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return serverClientInstance;
}

export const supabaseServer = {
  get client() {
    return getSupabaseServer();
  },
};
