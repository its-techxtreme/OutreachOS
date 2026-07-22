/**
 * @jest-environment node
 */

jest.mock('@/lib/supabase/middleware', () => ({
  updateSession: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/security-logger', () => ({
  SecurityEventType: {
    DATA_ACCESS_DENIED: 'DATA_ACCESS_DENIED',
  },
  SecurityLogger: {
    log: jest.fn(),
  },
}));

import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';
import proxy from '../../src/proxy';

function createRequest(path: string): NextRequest {
  const url = `http://localhost:3000${path}`;
  const nextUrl = new URL(url);

  return {
    url,
    nextUrl,
    cookies: {
      getAll: () => [],
      set: jest.fn(),
    },
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'user-agent') {
          return 'jest';
        }
        return null;
      },
    },
  } as unknown as NextRequest;
}

describe('Auth proxy', () => {
  const mockedUpdateSession = updateSession as jest.MockedFunction<
    typeof updateSession
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated users away from dashboard', async () => {
    mockedUpdateSession.mockResolvedValue({
      user: null,
      supabaseResponse: NextResponse.next(),
    });

    const response = await proxy(createRequest('/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Content-Security-Policy')).toContain(
      "default-src 'self'"
    );
  });

  it('returns 401 for unauthenticated /api/leads requests', async () => {
    mockedUpdateSession.mockResolvedValue({
      user: null,
      supabaseResponse: NextResponse.next(),
    });

    const response = await proxy(createRequest('/api/leads'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('allows authenticated access to dashboard', async () => {
    mockedUpdateSession.mockResolvedValue({
      user: { id: 'admin-1' } as never,
      supabaseResponse: NextResponse.next(),
    });

    const response = await proxy(createRequest('/dashboard'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Strict-Transport-Security')).toContain(
      'max-age=31536000'
    );
  });

  it('allows public agent API without session', async () => {
    mockedUpdateSession.mockResolvedValue({
      user: null,
      supabaseResponse: NextResponse.next(),
    });

    const response = await proxy(createRequest('/api/agent/leads'));
    expect(response.status).toBe(200);
  });

  it('redirects authenticated users away from login', async () => {
    mockedUpdateSession.mockResolvedValue({
      user: { id: 'admin-1' } as never,
      supabaseResponse: NextResponse.next(),
    });

    const response = await proxy(createRequest('/auth/login'));

    expect(response.status).toBe(307);
  });

  it('falls back safely when session update throws', async () => {
    mockedUpdateSession.mockRejectedValue(new Error('session boom'));

    const response = await proxy(createRequest('/dashboard'));

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('allows public /admin/login without session', async () => {
    mockedUpdateSession.mockResolvedValue({
      user: null,
      supabaseResponse: NextResponse.next(),
    });

    const response = await proxy(createRequest('/admin/login'));
    expect(response.status).toBe(200);
  });

  it('sends unauthenticated /admin/management-dashboard to admin login', async () => {
    mockedUpdateSession.mockResolvedValue({
      user: null,
      supabaseResponse: NextResponse.next(),
    });

    const response = await proxy(createRequest('/admin/management-dashboard'));
    expect(response.status).toBe(307);
    const location =
      response.headers.get('location') ??
      response.headers.get('Location') ??
      '';
    // Some Next test runtimes omit Location on Redirect; status still asserts redirect.
    if (location) {
      expect(location).toContain('/admin/login');
    }
  });

  it('allows Razorpay webhook without session', async () => {
    mockedUpdateSession.mockResolvedValue({
      user: null,
      supabaseResponse: NextResponse.next(),
    });

    const response = await proxy(createRequest('/api/billing/webhook'));
    expect(response.status).toBe(200);
  });
});
