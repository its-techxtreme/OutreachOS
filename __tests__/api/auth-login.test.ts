/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/login/route';

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(),
}));

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const mockCreateServer = createServerSupabaseClient as jest.MockedFunction<
  typeof createServerSupabaseClient
>;
const mockGetServer = getSupabaseServer as jest.MockedFunction<
  typeof getSupabaseServer
>;

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signs in with email', async () => {
    mockCreateServer.mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 't',
              refresh_token: 'r',
            },
            user: {
              id: '1',
              user_metadata: { username: 'rio' },
              app_metadata: { roles: ['user'] },
            },
          },
          error: null,
        }),
      },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'rio@example.com',
          password: 'secret123',
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.redirectTo).toBe('/dashboard');
    expect(body.accessToken).toBe('t');
    expect(body.refreshToken).toBe('r');
  });

  it('resolves username via RPC then signs in', async () => {
    mockGetServer.mockReturnValue({
      rpc: jest.fn().mockResolvedValue({
        data: 'rio@example.com',
        error: null,
      }),
    } as never);

    mockCreateServer.mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 't',
              refresh_token: 'r',
            },
            user: {
              id: '1',
              user_metadata: {},
              app_metadata: { roles: ['user'] },
            },
          },
          error: null,
        }),
      },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'rio_sketch',
          password: 'secret123',
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.redirectTo).toBe('/auth/username');
  });

  it('returns 401 for invalid credentials', async () => {
    mockCreateServer.mockResolvedValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { session: null, user: null },
          error: { message: 'Invalid login' },
        }),
      },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'rio@example.com',
          password: 'wrong',
        }),
      })
    );

    expect(response.status).toBe(401);
  });
});
