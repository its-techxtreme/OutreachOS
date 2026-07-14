import { GET } from '@/app/api/leads/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(),
}));

import { getSupabaseServer } from '@/lib/supabase-server';

const mockedGetSupabaseServer = getSupabaseServer as jest.MockedFunction<
  typeof getSupabaseServer
>;

describe('GET /api/leads error handling', () => {
  it('returns 500 when the database query fails', async () => {
    mockedGetSupabaseServer.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(async () => ({
            data: null,
            error: { message: 'Database unavailable' },
          })),
        })),
      })),
    } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch leads');
  });
});
