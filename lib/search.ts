import type { SupabaseClient } from '@supabase/supabase-js';

import { sanitizeInput } from '@/lib/sanitize';
import type { Database, Lead, LeadStatus } from '@/types/database.types';

export interface LeadsQueryParams {
  searchTerm?: string;
  niche?: string;
  country?: string;
  status?: LeadStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  /** When set, only these lead IDs are visible (demo showcase). */
  allowedLeadIds?: number[];
  /** Scope results to a single owner's personal pool. */
  ownerId?: string;
}

export interface LeadsQueryResult {
  leads: Lead[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const DEFAULT_PAGE_SIZE = 100;
const FUZZY_SIMILARITY_THRESHOLD = 0.3;

function sanitizeSearchTerm(term: string): string {
  return sanitizeInput(term)
    .replace(/[,()"%\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeIlikePattern(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&');
}

export class LeadSearchService {
  static async queryLeads(
    supabase: SupabaseClient<Database>,
    params: LeadsQueryParams = {}
  ): Promise<LeadsQueryResult> {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.min(Math.max(params.pageSize ?? DEFAULT_PAGE_SIZE, 1), 500);
    const hasFilters = Boolean(
      params.searchTerm?.trim() ||
        params.niche ||
        params.country ||
        params.status ||
        params.startDate ||
        params.endDate
    );

    // Demo / scoped queries must stay on the builder so ID allow-lists apply.
    if (hasFilters && !params.allowedLeadIds?.length) {
      const rpcResult = await this.queryViaRpc(supabase, params, page, pageSize);
      if (rpcResult) {
        return rpcResult;
      }
    }

    return this.queryViaBuilder(supabase, params, page, pageSize);
  }

  static async fuzzySearch(
    supabase: SupabaseClient<Database>,
    term: string,
    threshold = FUZZY_SIMILARITY_THRESHOLD,
    ownerId?: string
  ): Promise<Lead[]> {
    const { data, error } = await supabase.rpc('search_leads_fuzzy', {
      search_term: term,
      sim_threshold: threshold,
      result_limit: 50,
      p_owner_id: ownerId ?? null,
    });

    if (error) {
      throw error;
    }

    return (data as Lead[]) ?? [];
  }

  private static async queryViaRpc(
    supabase: SupabaseClient<Database>,
    params: LeadsQueryParams,
    page: number,
    pageSize: number
  ): Promise<LeadsQueryResult | null> {
    const { data, error } = await supabase.rpc('get_leads_filtered', {
      p_search: params.searchTerm?.trim() || null,
      p_niche: params.niche ?? null,
      p_country: params.country ?? null,
      p_status: params.status ?? null,
      p_start_date: params.startDate ?? null,
      p_end_date: params.endDate ?? null,
      p_page: page,
      p_page_size: pageSize,
      p_owner_id: params.ownerId ?? null,
    });

    if (error) {
      return null;
    }

    const payload = data as {
      leads: Lead[];
      totalCount: number;
      page: number;
      pageSize: number;
    };

    const totalCount = payload.totalCount ?? 0;

    return {
      leads: payload.leads ?? [],
      totalCount,
      page: payload.page ?? page,
      pageSize: payload.pageSize ?? pageSize,
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };
  }

  private static async queryViaBuilder(
    supabase: SupabaseClient<Database>,
    params: LeadsQueryParams,
    page: number,
    pageSize: number
  ): Promise<LeadsQueryResult> {
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (params.ownerId) {
      query = query.eq('owner_id', params.ownerId);
    }

    if (params.allowedLeadIds) {
      if (params.allowedLeadIds.length === 0) {
        return {
          leads: [],
          totalCount: 0,
          page,
          pageSize,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
      query = query.in('id', params.allowedLeadIds);
    }

    if (params.niche) {
      query = query.eq('niche', params.niche);
    }

    if (params.country) {
      query = query.eq('country', params.country);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    const normalizedSearch = params.searchTerm
      ? sanitizeSearchTerm(params.searchTerm)
      : '';

    if (normalizedSearch) {
      const term = `%${escapeIlikePattern(normalizedSearch)}%`;
      query = query.or(
        `name.ilike.${term},niche.ilike.${term},country.ilike.${term},phone.ilike.${term},address.ilike.${term}`
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const totalCount = count ?? 0;

    return {
      leads: data ?? [],
      totalCount,
      page,
      pageSize,
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };
  }
}
