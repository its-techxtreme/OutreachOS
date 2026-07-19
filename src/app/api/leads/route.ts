import { NextRequest, NextResponse } from 'next/server';

import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { RBACService } from '@/lib/auth/rbac';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { getDemoSampleLeadIds } from '@/lib/demo/sample-leads';
import { applyUserLeadStatusOverlays } from '@/lib/leads/user-lead-status';
import { LeadSearchService, type LeadsQueryParams } from '@/lib/search';
import { sanitizeInput } from '@/lib/sanitize';
import { getSupabaseServer } from '@/lib/supabase-server';
import type { Lead, LeadStatus } from '@/types/database.types';

const VALID_STATUSES: LeadStatus[] = [
  'New',
  'Called',
  'No Answer',
  'Callback',
  'Replied',
  'Converted',
  'Archived',
];

function parseOptionalInt(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseQueryParams(request: NextRequest): LeadsQueryParams {
  const { searchParams } = request.nextUrl;

  const statusParam = searchParams.get('status');
  const status =
    statusParam && VALID_STATUSES.includes(statusParam as LeadStatus)
      ? (statusParam as LeadStatus)
      : undefined;

  const rawQ = searchParams.get('q');
  const rawNiche = searchParams.get('niche');
  const rawCountry = searchParams.get('country');
  const rawStart = searchParams.get('startDate');
  const rawEnd = searchParams.get('endDate');

  return {
    searchTerm: rawQ ? sanitizeInput(rawQ).slice(0, 200) : undefined,
    niche: rawNiche ? sanitizeInput(rawNiche).slice(0, 120) : undefined,
    country: rawCountry ? sanitizeInput(rawCountry).slice(0, 120) : undefined,
    status,
    startDate: rawStart ? sanitizeInput(rawStart).slice(0, 40) : undefined,
    endDate: rawEnd ? sanitizeInput(rawEnd).slice(0, 40) : undefined,
    page: parseOptionalInt(searchParams.get('page')),
    pageSize: parseOptionalInt(searchParams.get('pageSize')),
  };
}

export async function GET(request?: NextRequest): Promise<NextResponse> {
  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return unauthorizedJsonResponse();
    }

    const user = await ensureDefaultUserRole(rawUser);
    const supabase = getSupabaseServer();
    const params: LeadsQueryParams = request ? parseQueryParams(request) : {};

    if (RBACService.isDemoUser(user)) {
      params.allowedLeadIds = await getDemoSampleLeadIds(supabase);
    } else {
      params.ownerId = user.id;
    }

    const hasPagination =
      params.page !== undefined || params.pageSize !== undefined;
    const hasFilters = Boolean(
      params.searchTerm ||
        params.niche ||
        params.country ||
        params.status ||
        params.startDate ||
        params.endDate
    );

    // Paginated / filtered / demo-scoped queries go through the search service.
    // Unscoped owner dashboard loads need the full personal pool (not the
    // default pageSize of 100), so skip the search service when the client
    // asks for everything.
    if (hasPagination || hasFilters || params.allowedLeadIds) {
      const result = await LeadSearchService.queryLeads(supabase, params);
      const leads = RBACService.isDemoUser(user)
        ? await applyUserLeadStatusOverlays(supabase, user.id, result.leads)
        : result.leads;

      return NextResponse.json({
        leads,
        pagination: {
          currentPage: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
        },
      });
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: error.message },
        { status: 500 }
      );
    }

    const owned = (data ?? []) as Lead[];
    return NextResponse.json({ leads: owned });
  } catch (fetchError) {
    const message =
      fetchError instanceof Error ? fetchError.message : 'Unknown error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
