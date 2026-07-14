import { LeadSearchService } from '@/lib/search';

describe('LeadSearchService RPC paths', () => {
  it('uses RPC results when filtered query RPC succeeds', async () => {
    const mockRpc = jest.fn().mockResolvedValue({
      data: {
        leads: [{ id: 1, name: 'RPC Lead' }],
        totalCount: 1,
        page: 1,
        pageSize: 100,
      },
      error: null,
    });

    const supabase = {
      from: jest.fn(),
      rpc: mockRpc,
    } as never;

    const result = await LeadSearchService.queryLeads(supabase, {
      niche: 'SaaS',
      page: 1,
      pageSize: 100,
    });

    expect(mockRpc).toHaveBeenCalledWith('get_leads_filtered', expect.any(Object));
    expect(result.leads).toHaveLength(1);
    expect(result.leads[0]?.name).toBe('RPC Lead');
  });

  it('performs fuzzy search via RPC helper', async () => {
    const mockRpc = jest.fn().mockResolvedValue({
      data: [{ id: 2, name: 'Fuzzy Match' }],
      error: null,
    });

    const supabase = { rpc: mockRpc } as never;
    const results = await LeadSearchService.fuzzySearch(supabase, 'fuzzy');

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Fuzzy Match');
  });

  it('throws when fuzzy search RPC fails', async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'rpc failed' },
      }),
    } as never;

    await expect(LeadSearchService.fuzzySearch(supabase, 'broken')).rejects.toEqual({
      message: 'rpc failed',
    });
  });
});
