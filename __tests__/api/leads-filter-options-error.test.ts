import { GET } from '@/app/api/leads/filter-options/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        not: jest.fn(async () => ({
          data: null,
          error: { message: 'niche query failed' },
        })),
      })),
    })),
  })),
}));

describe('GET /api/leads/filter-options errors', () => {
  it('returns 500 when niche query fails', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('niche query failed');
  });
});
