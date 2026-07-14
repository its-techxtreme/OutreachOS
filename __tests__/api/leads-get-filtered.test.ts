import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/leads/route';

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
    data: [{ id: 1, name: 'Filtered Lead' }],
    count: 1,
    error: null,
  });

  return builder;
}

const mockRpc = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn(() => ({ select: jest.fn(() => createQueryBuilderMock()) })),
    rpc: mockRpc,
  })),
}));

describe('GET /api/leads with query params', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: { message: 'missing rpc' } });
  });

  it('returns paginated filtered leads when query params are provided', async () => {
    const request = {
      nextUrl: new URL(
        'http://localhost/api/leads?q=alpha&niche=SaaS&page=1&pageSize=50'
      ),
    } as NextRequest;

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.leads).toHaveLength(1);
    expect(payload.pagination.totalCount).toBe(1);
  });
});
