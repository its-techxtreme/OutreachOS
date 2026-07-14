import { LeadSearchService } from '@/lib/search';

type QueryBuilderMock = {
  eq: jest.Mock;
  gte: jest.Mock;
  lte: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
};

function createQueryBuilderMock(): QueryBuilderMock {
  const builder: QueryBuilderMock = {
    eq: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
  };

  builder.eq.mockReturnValue(builder);
  builder.gte.mockReturnValue(builder);
  builder.lte.mockReturnValue(builder);
  builder.or.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.range.mockResolvedValue({
    data: [{ id: 1, name: 'Test Lead' }],
    count: 1,
    error: null,
  });

  return builder;
}

describe('LeadSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries leads via the query builder', async () => {
    const builder = createQueryBuilderMock();
    const supabase = {
      from: jest.fn(() => ({ select: jest.fn(() => builder) })),
      rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'missing rpc' } }),
    } as never;

    const result = await LeadSearchService.queryLeads(supabase, {
      niche: 'SaaS',
      page: 1,
      pageSize: 50,
    });

    expect(result.leads).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.hasNextPage).toBe(false);
  });
});
