import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { withApiHeaders } from '@/lib/api-helpers';
import {
  getServerAuthUser,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { PREMIUM_REQUEST_EMAIL } from '@/lib/brand';

export const runtime = 'nodejs';

/**
 * Online checkout is paused (no payment gateway until KYC/PAN is ready).
 * Clients should use mailto Premium requests on /pricing instead.
 */
export async function POST(): Promise<NextResponse> {
  const requestId = randomUUID();
  const user = await getServerAuthUser();
  if (!user) {
    return withApiHeaders(unauthorizedJsonResponse(requestId), requestId);
  }

  return withApiHeaders(
    NextResponse.json(
      {
        error:
          'Online checkout is paused. Request Premium by email from /pricing.',
        requestEmail: PREMIUM_REQUEST_EMAIL,
        requestId,
      },
      { status: 503 }
    ),
    requestId
  );
}
