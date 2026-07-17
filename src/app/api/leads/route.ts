import { NextRequest, NextResponse } from 'next/server';

import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { RBACService } from '@/lib/auth/rbac';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { getDemoSampleLeadIds } from '@/lib/demo/sample-leads';
import { LeadSearchService, type LeadsQueryParams } from '@/lib/search';
import { getSupabaseServer } from '@/lib/supabase-server';
import type { LeadStatus } from '@/types/database.types';

const VALID_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
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

  return {
    searchTerm: searchParams.get('q') ?? undefined,
    niche: searchParams.get('niche') ?? undefined,
    country: searchParams.get('country') ?? undefined,
    status,
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
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

      return NextResponse.json({
        leads: result.leads,
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

    return NextResponse.json({ leads: data ?? [] });
  } catch (fetchError) {
    const message =
      fetchError instanceof Error ? fetchError.message : 'Unknown error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
