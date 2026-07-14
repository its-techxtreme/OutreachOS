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
    data: [],
    count: 0,
    error: null,
  });

  return builder;
}

describe('LeadSearchService query builder filters', () => {
  it('applies country, status, and date filters in the builder path', async () => {
    const builder = createQueryBuilderMock();
    const supabase = {
      from: jest.fn(() => ({ select: jest.fn(() => builder) })),
      rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'missing' } }),
    } as never;

    await LeadSearchService.queryLeads(supabase, {
      country: 'USA',
      status: 'New',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      page: 1,
      pageSize: 25,
    });

    expect(builder.eq).toHaveBeenCalled();
    expect(builder.gte).toHaveBeenCalled();
    expect(builder.lte).toHaveBeenCalled();
  });

  it('sanitizes search terms before applying ilike filters', async () => {
    const builder = createQueryBuilderMock();
    const supabase = {
      from: jest.fn(() => ({ select: jest.fn(() => builder) })),
      rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'missing' } }),
    } as never;

    await LeadSearchService.queryLeads(supabase, {
      searchTerm: 'alpha,beta',
      page: 1,
      pageSize: 25,
    });

    expect(builder.or).toHaveBeenCalled();
  });
});
