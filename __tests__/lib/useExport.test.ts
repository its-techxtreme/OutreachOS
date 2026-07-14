import { act, renderHook } from '@testing-library/react';

import { useExport } from '@/lib/hooks/useExport';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

describe('useExport', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('a'));
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('a'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports leads with progress updates for large datasets', async () => {
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportLeads(createMockLeads(2500));
    });

    expect(result.current.exportProgress).toBe(100);
    expect(result.current.isExporting).toBe(false);
  });

  it('captures export errors', async () => {
    URL.createObjectURL = jest.fn(() => {
      throw new Error('Blob failed');
    });

    const { result } = renderHook(() => useExport());

    await act(async () => {
      try {
        await result.current.exportLeads(createMockLeads(2));
      } catch {
        // Expected export failure
      }
    });

    expect(result.current.exportError).toBe('Blob failed');
  });
});
