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
              data: [{ niche: 'SaaS' }],
              error: null,
            });
          }

          return createFilterQueryMock({
            data: null,
            error: { message: 'country query failed' },
          });
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
