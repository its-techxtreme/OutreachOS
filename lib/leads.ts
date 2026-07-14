import type { PostgrestError } from '@supabase/supabase-js';

import { getSupabaseServer } from './supabase-server';
import type { LeadInsert } from '@/types/database.types';
import type { ValidatedLead } from './validation/lead-schema';

export interface LeadCreationResult {
  kind: 'created';
  id: number;
  created_at: string;
}

export interface LeadDuplicateResult {
  kind: 'duplicate';
}

export interface LeadFailureResult {
  kind: 'error';
  error: PostgrestError;
}

export type LeadSubmissionResult =
  | LeadCreationResult
  | LeadDuplicateResult
  | LeadFailureResult;

export type LeadInput = Pick<ValidatedLead, 'name' | 'niche' | 'country' | 'maps_url'> &
  Partial<Pick<ValidatedLead, 'phone' | 'address'>>;

export function isUniqueViolation(error: PostgrestError): boolean {
  return error.code === '23505';
}

export async function submitLead(lead: LeadInput): Promise<LeadSubmissionResult> {
  const payload: LeadInsert = {
    name: lead.name,
    niche: lead.niche,
    country: lead.country,
    phone: lead.phone ?? null,
    address: lead.address ?? null,
    maps_url: lead.maps_url,
    status: 'New',
  };

  const { data, error } = await getSupabaseServer()
    .from('leads')
    .insert(payload)
    .select('id, created_at')
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return { kind: 'duplicate' };
    }

    return { kind: 'error', error };
  }

  return {
    kind: 'created',
    id: data.id,
    created_at: data.created_at,
  };
}
