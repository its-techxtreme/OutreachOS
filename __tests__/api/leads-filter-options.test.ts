import { GET } from '@/app/api/leads/filter-options/route';

type FilterQueryMock = {
  eq: jest.Mock;
  in: jest.Mock;
  then: (
    onFulfilled?: (value: { data: unknown; error: unknown }) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => Promise<unknown>;
};

function createFilterQueryMock(result: {
  data: unknown;
  error: unknown;
}): FilterQueryMock {
  const builder: FilterQueryMock = {
    eq: jest.fn(),
    in: jest.fn(),
    then: (onFulfilled, onRejected) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };

  builder.eq.mockReturnValue(builder);
  builder.in.mockReturnValue(builder);

  return builder;
}

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn((column: string) => ({
        not: jest.fn(() => {
          if (column === 'niche') {
            return createFilterQueryMock({
              data: [{ niche: 'SaaS' }, { niche: 'FinTech' }, { niche: 'SaaS' }],
              error: null,
            });
          }

          return createFilterQueryMock({
            data: [
              { country: 'USA' },
              { country: 'UK' },
              { country: 'USA' },
            ],
            error: null,
          });
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
