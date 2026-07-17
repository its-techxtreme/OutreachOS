import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * Agent/API-key lead inserts attach to the bootstrap admin account.
 */
export async function resolveAgentLeadOwnerId(): Promise<string | null> {
  const configured = process.env.AGENT_LEAD_OWNER_ID?.trim();
  if (configured) {
    return configured;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return null;
  }

  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error || !data?.users) {
    return null;
  }

  const match = data.users.find(
    (user) => user.email?.toLowerCase() === adminEmail.toLowerCase()
  );
  return match?.id ?? null;
}
