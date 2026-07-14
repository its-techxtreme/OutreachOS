import { GET } from '@/app/api/leads/route';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(() => {
    throw 'string failure';
  }),
}));

describe('GET /api/leads unknown exception handling', () => {
  it('returns generic message for non-error throws', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Unknown error');
  });
});
