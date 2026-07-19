import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Lead, LeadStatus } from '@/types/database.types';

type AdminClient = SupabaseClient<Database>;

/** Overlay per-user status onto shared/sample leads (demo isolation). */
export async function applyUserLeadStatusOverlays(
  supabase: AdminClient,
  userId: string,
  leads: Lead[]
): Promise<Lead[]> {
  if (leads.length === 0) {
    return leads;
  }

  const ids = leads.map((lead) => lead.id);
  const { data, error } = await supabase
    .from('user_lead_status')
    .select('lead_id, status')
    .eq('user_id', userId)
    .in('lead_id', ids);

  if (error || !data?.length) {
    return leads;
  }

  const byLead = new Map<number, LeadStatus>();
  for (const row of data) {
    byLead.set(row.lead_id, row.status as LeadStatus);
  }

  return leads.map((lead) => {
    const overlay = byLead.get(lead.id);
    return overlay ? { ...lead, status: overlay } : lead;
  });
}

export async function upsertUserLeadStatus(
  supabase: AdminClient,
  userId: string,
  leadId: number,
  status: LeadStatus
): Promise<void> {
  const { error } = await supabase.from('user_lead_status').upsert(
    {
      user_id: userId,
      lead_id: leadId,
      status,
    },
    { onConflict: 'user_id,lead_id' }
  );

  if (error) {
    throw error;
  }
}
