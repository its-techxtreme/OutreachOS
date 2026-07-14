import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/leads/route';

type QueryBuilderMock = {
  eq: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
};

function createQueryBuilderMock(): QueryBuilderMock {
  const builder: QueryBuilderMock = {
    eq: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
  };

  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.range.mockResolvedValue({
    data: [],
    count: 0,
    error: null,
  });

  return builder;
}

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn(() => ({ select: jest.fn(() => createQueryBuilderMock()) })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'missing rpc' } }),
  })),
}));

describe('GET /api/leads param validation', () => {
  it('ignores invalid status and page values', async () => {
    const request = {
      nextUrl: new URL(
        'http://localhost/api/leads?status=Invalid&page=abc&pageSize=xyz&niche=SaaS'
      ),
    } as NextRequest;

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.pagination.currentPage).toBe(1);
  });
});
