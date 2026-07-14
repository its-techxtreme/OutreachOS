import { renderHook, waitFor } from '@testing-library/react';

import { useFilterOptions } from '@/lib/hooks/useFilterOptions';

describe('useFilterOptions non-error rejections', () => {
  it('sets a generic error for non-error rejections', async () => {
    global.fetch = jest.fn().mockRejectedValue('network down') as jest.Mock;

    const { result } = renderHook(() => useFilterOptions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch filter options');
  });
});
