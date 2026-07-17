import { getServerAuthUser } from '@/lib/auth/require-session';
import { GET } from '@/app/api/leads/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(async () => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('Protected leads API auth', () => {
  it('returns 401 when session is missing', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValueOnce(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized');
  });
});
