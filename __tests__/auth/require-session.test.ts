/**
 * @jest-environment node
 */

jest.unmock('@/lib/auth/require-session');

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

import {
  getServerAuthUser,
  requireServerAuth,
  unauthorizedJsonResponse,
} from '@/lib/auth/require-session';
import { createServerSupabaseClient } from '@/lib/supabase/server';

describe('require-session helpers', () => {
  const mockedCreate = createServerSupabaseClient as jest.MockedFunction<
    typeof createServerSupabaseClient
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user when authenticated', async () => {
    mockedCreate.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'u1' } },
          error: null,
        }),
      },
    } as never);

    await expect(getServerAuthUser()).resolves.toEqual({ id: 'u1' });
  });

  it('returns null when auth fails', async () => {
    mockedCreate.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'nope' },
        }),
      },
    } as never);

    await expect(getServerAuthUser()).resolves.toBeNull();
  });

  it('requireServerAuth throws without a user', async () => {
    mockedCreate.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as never);

    await expect(requireServerAuth()).rejects.toThrow('Authentication required');
  });

  it('requireServerAuth returns the user', async () => {
    mockedCreate.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'u2' } },
          error: null,
        }),
      },
    } as never);

    await expect(requireServerAuth()).resolves.toEqual({ id: 'u2' });
  });

  it('builds unauthorized JSON responses', async () => {
    const response = unauthorizedJsonResponse('req-1');
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized', requestId: 'req-1' });
  });
});
