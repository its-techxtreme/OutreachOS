import { GET } from '@/app/api/leads/filter-options/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn((column: string) => ({
        not: jest.fn(async () => {
          if (column === 'niche') {
            return {
              data: [{ niche: 'SaaS' }, { niche: 'FinTech' }, { niche: 'SaaS' }],
              error: null,
            };
          }

          return {
            data: [{ country: 'USA' }, { country: 'UK' }, { country: 'USA' }],
            error: null,
          };
        }),
      })),
    })),
  })),
}));

describe('GET /api/leads/filter-options', () => {
  it('returns unique niches and countries', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.niches).toEqual(['FinTech', 'SaaS']);
    expect(payload.countries).toEqual(['UK', 'USA']);
  });
});
