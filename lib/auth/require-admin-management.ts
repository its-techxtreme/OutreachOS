import { NextResponse } from 'next/server';

import {
  adminDashboardDenyMessage,
  evaluateAdminDashboardAccess,
} from '@/lib/auth/admin-dashboard-gate';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { withApiHeaders } from '@/lib/api-helpers';

export async function requireAdminManagementAccess(
  requestId?: string
): Promise<
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getServerAuthUser>>> }
  | { ok: false; response: NextResponse }
> {
  const user = await getServerAuthUser();
  if (!user) {
    return {
      ok: false,
      response: withApiHeaders(unauthorizedJsonResponse(requestId), requestId),
    };
  }

  const gate = evaluateAdminDashboardAccess(user);
  if (!gate.ok) {
    return {
      ok: false,
      response: withApiHeaders(
        NextResponse.json(
          {
            error: adminDashboardDenyMessage(gate.reason),
            reason: gate.reason,
            requestId,
          },
          { status: 403 }
        ),
        requestId
      ),
    };
  }

  return { ok: true, user };
}
