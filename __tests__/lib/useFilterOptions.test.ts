import { renderHook, waitFor } from '@testing-library/react';

import { useFilterOptions } from '@/lib/hooks/useFilterOptions';

describe('useFilterOptions', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        niches: ['FinTech', 'SaaS'],
        countries: ['UK', 'USA'],
      }),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads niches and countries from the API', async () => {
    const { result } = renderHook(() => useFilterOptions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.niches).toEqual(['FinTech', 'SaaS']);
    expect(result.current.countries).toEqual(['UK', 'USA']);
    expect(result.current.error).toBeNull();
  });
});
