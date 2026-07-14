import { GET } from '@/app/api/leads/filter-options/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => {
    throw new Error('Supabase unavailable');
  }),
}));

describe('GET /api/leads/filter-options unexpected errors', () => {
  it('returns 500 for unexpected exceptions', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Supabase unavailable');
  });
});
