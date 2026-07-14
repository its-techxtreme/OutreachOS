import { renderHook, waitFor } from '@testing-library/react';

import { useFilterOptions } from '@/lib/hooks/useFilterOptions';

describe('useFilterOptions errors', () => {
  it('sets error when API request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to fetch filter options' }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFilterOptions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch filter options');
  });
});
