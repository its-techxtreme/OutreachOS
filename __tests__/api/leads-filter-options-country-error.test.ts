import { GET } from '@/app/api/leads/filter-options/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn((column: string) => ({
        not: jest.fn(async () => {
          if (column === 'niche') {
            return { data: [{ niche: 'SaaS' }], error: null };
          }

          return { data: null, error: { message: 'country query failed' } };
        }),
      })),
    })),
  })),
}));

describe('GET /api/leads/filter-options country errors', () => {
  it('returns country query failures', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('country query failed');
  });
});
