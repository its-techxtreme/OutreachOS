/**
 * @jest-environment node
 */
import { POST } from '@/app/api/account/delete/route';

jest.mock('@/lib/auth/require-session', () => ({
  getServerAuthUser: jest.fn(),
  unauthorizedJsonResponse: (requestId?: string) =>
    new Response(JSON.stringify({ error: 'Unauthorized', requestId }), {
      status: 401,
    }),
}));

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { getServerAuthUser } from '@/lib/auth/require-session';
import { getSupabaseServer } from '@/lib/supabase-server';

const mockGetUser = getServerAuthUser as jest.MockedFunction<
  typeof getServerAuthUser
>;
const mockGetServer = getSupabaseServer as jest.MockedFunction<
  typeof getSupabaseServer
>;

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const response = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        body: JSON.stringify({ confirmation: 'delete' }),
      })
    );
    expect(response.status).toBe(401);
  });

  it('returns 403 for demo accounts', async () => {
    mockGetUser.mockResolvedValue({
      id: 'd1',
      app_metadata: { roles: ['demo'] },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'delete' }),
      })
    );
    expect(response.status).toBe(403);
  });

  it('returns 400 when confirmation is wrong', async () => {
    mockGetUser.mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: ['user'] },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })
    );
    expect(response.status).toBe(400);
  });

  it('deletes owned leads then auth user', async () => {
    mockGetUser.mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: ['user'] },
    } as never);

    const deleteUser = jest.fn().mockResolvedValue({ error: null });
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn(() => ({ eq }));
    mockGetServer.mockReturnValue({
      from: jest.fn(() => ({ delete: del })),
      auth: { admin: { deleteUser } },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'delete' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(eq).toHaveBeenCalledWith('owner_id', 'u1');
    expect(deleteUser).toHaveBeenCalledWith('u1');
  });
});
