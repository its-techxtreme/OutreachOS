import { GET } from '@/app/api/leads/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => {
    throw new Error('Unexpected failure');
  }),
}));

describe('GET /api/leads exception handling', () => {
  it('returns 500 for unexpected errors', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Unexpected failure');
  });
});
