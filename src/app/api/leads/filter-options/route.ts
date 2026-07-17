import { NextResponse } from 'next/server';

import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { RBACService } from '@/lib/auth/rbac';
import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import { getDemoSampleLeadIds } from '@/lib/demo/sample-leads';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(): Promise<NextResponse> {
  try {
    const rawUser = await getServerAuthUser();
    if (!rawUser) {
      return unauthorizedJsonResponse();
    }

    const user = await ensureDefaultUserRole(rawUser);
    const supabase = getSupabaseServer();
    const isDemo = RBACService.isDemoUser(user);
    const demoIds = isDemo ? await getDemoSampleLeadIds(supabase) : null;

    if (isDemo && (!demoIds || demoIds.length === 0)) {
      return NextResponse.json({ niches: [], countries: [] });
    }

    let nicheQuery = supabase.from('leads').select('niche').not('niche', 'is', null);
    let countryQuery = supabase
      .from('leads')
      .select('country')
      .not('country', 'is', null);

    if (demoIds) {
      nicheQuery = nicheQuery.in('id', demoIds);
      countryQuery = countryQuery.in('id', demoIds);
    } else {
      nicheQuery = nicheQuery.eq('owner_id', user.id);
      countryQuery = countryQuery.eq('owner_id', user.id);
    }

    const [nicheResult, countryResult] = await Promise.all([
      nicheQuery,
      countryQuery,
    ]);

    if (nicheResult.error || countryResult.error) {
      const message =
        nicheResult.error?.message ??
        countryResult.error?.message ??
        'Failed to fetch filter options';

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const niches = [
      ...new Set(nicheResult.data?.map((row) => row.niche) ?? []),
    ].sort((a, b) => a.localeCompare(b));

    const countries = [
      ...new Set(countryResult.data?.map((row) => row.country) ?? []),
    ].sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ niches, countries });
  } catch (fetchError) {
    const message =
      fetchError instanceof Error ? fetchError.message : 'Unknown error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
