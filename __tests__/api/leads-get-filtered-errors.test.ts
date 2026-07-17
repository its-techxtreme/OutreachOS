import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/leads/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(async () => ({
            data: null,
            error: { message: 'db unavailable' },
          })),
        })),
      })),
    })),
  })),
}));

describe('GET /api/leads error handling', () => {
  it('returns 500 when unfiltered fetch fails', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch leads');
  });

  it('returns 500 when filtered query throws', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase-server');
    (getSupabaseServer as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn(() => ({
            range: jest.fn().mockRejectedValue(new Error('query failed')),
          })),
        })),
      })),
    });

    const request = {
      nextUrl: new URL('http://localhost/api/leads?page=1'),
    } as NextRequest;

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('query failed');
  });
});
