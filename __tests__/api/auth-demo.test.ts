/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';

import { POST } from '@/app/api/auth/demo/route';

jest.mock('@/lib/rate-limiter', () => ({
  rateLimiters: {
    demoSignIn: {
      check: jest.fn().mockResolvedValue({ success: true }),
    },
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/security-logger', () => ({
  SecurityEventType: {
    AUTH_SUCCESS: 'AUTH_SUCCESS',
    AUTH_FAILURE: 'AUTH_FAILURE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  },
  SecurityLogger: { log: jest.fn() },
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { createServerSupabaseClient } from '@/lib/supabase/server';

describe('POST /api/auth/demo', () => {
  const originalEmail = process.env.DEMO_USER_EMAIL;
  const originalPassword = process.env.DEMO_USER_PASSWORD;

  afterEach(() => {
    process.env.DEMO_USER_EMAIL = originalEmail;
    process.env.DEMO_USER_PASSWORD = originalPassword;
    jest.clearAllMocks();
  });

  it('returns 503 when demo credentials are missing', async () => {
    delete process.env.DEMO_USER_EMAIL;
    delete process.env.DEMO_USER_PASSWORD;

    const response = await POST(
      new Request('http://localhost/api/auth/demo', { method: 'POST' })
    );

    expect(response.status).toBe(503);
  });

  it('signs in with demo credentials and returns redirect', async () => {
    process.env.DEMO_USER_EMAIL = 'demo@example.com';
    process.env.DEMO_USER_PASSWORD = 'demo-pass';

    (createServerSupabaseClient as jest.Mock).mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            session: { access_token: 'tok', refresh_token: 'ref' },
            user: { id: 'demo-1' },
          },
          error: null,
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost/api/auth/demo', {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.1.1.1' },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.redirectTo).toBe('/dashboard');
    expect(body.accessToken).toBe('tok');
    expect(body.refreshToken).toBe('ref');
  });
});
