import { GET } from '@/app/api/leads/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(async () => ({
            data: [
              {
                id: 1,
                name: 'Test Lead',
                niche: 'SaaS',
                country: 'USA',
                phone: null,
                address: null,
                maps_url: 'https://maps.google.com/?q=test',
                status: 'New',
                created_at: '2026-01-01T00:00:00.000Z',
                updated_at: '2026-01-01T00:00:00.000Z',
              },
            ],
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('GET /api/leads', () => {
  it('returns leads from the database', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.leads).toHaveLength(1);
    expect(payload.leads[0].name).toBe('Test Lead');
  });
});
