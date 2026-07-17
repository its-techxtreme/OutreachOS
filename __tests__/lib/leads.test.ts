import { isUniqueViolation, submitLead } from '@/lib/leads';
import { getSupabaseServer } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(),
}));

describe('lead submission service', () => {
  const mockSingle = jest.fn();
  const mockSelect = jest.fn(() => ({ single: mockSingle }));
  const mockInsert = jest.fn(() => ({ select: mockSelect }));
  const mockFrom = jest.fn(() => ({ insert: mockInsert }));

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseServer as jest.Mock).mockReturnValue({ from: mockFrom });
  });

  it('creates a lead successfully', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 42, created_at: '2026-06-19T00:00:00.000Z' },
      error: null,
    });

    const result = await submitLead({
      name: 'Acme Corp',
      niche: 'Interior Design',
      country: 'United States',
      phone: '+1-555-0100',
      address: '123 Main Street',
      maps_url: 'https://maps.google.com/?q=acme',
      owner_id: 'owner-1',
    });

    expect(result).toEqual({
      kind: 'created',
      id: 42,
      created_at: '2026-06-19T00:00:00.000Z',
    });
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+1-555-0100',
        address: '123 Main Street',
        owner_id: 'owner-1',
      })
    );
  });

  it('returns duplicate result for unique constraint violations', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const result = await submitLead({
      name: 'Acme Corp',
      niche: 'Interior Design',
      country: 'United States',
      maps_url: 'https://maps.google.com/?q=acme',
      owner_id: 'owner-1',
    });

    expect(result).toEqual({ kind: 'duplicate' });
  });

  it('returns error result for other database failures', async () => {
    const dbError = { code: '42501', message: 'permission denied' };
    mockSingle.mockResolvedValue({ data: null, error: dbError });

    const result = await submitLead({
      name: 'Acme Corp',
      niche: 'Interior Design',
      country: 'United States',
      maps_url: 'https://maps.google.com/?q=acme',
      owner_id: 'owner-1',
    });

    expect(result).toEqual({ kind: 'error', error: dbError });
  });

  it('detects unique violation error codes', () => {
    expect(isUniqueViolation({ code: '23505', message: 'duplicate' } as never)).toBe(true);
    expect(isUniqueViolation({ code: '42501', message: 'denied' } as never)).toBe(false);
  });
});
