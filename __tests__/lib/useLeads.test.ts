import { renderHook, waitFor } from '@testing-library/react';

import { useLeads } from '@/lib/hooks/useLeads';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

describe('useLeads', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ leads: createMockLeads(3) }),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches leads from the API on mount', async () => {
    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.leads).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to fetch leads' }),
    }) as jest.Mock;

    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch leads');
  });

  it('sets error for non-error fetch rejections', async () => {
    global.fetch = jest.fn().mockRejectedValue('network down') as jest.Mock;

    const { result } = renderHook(() => useLeads());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch leads');
  });
});
