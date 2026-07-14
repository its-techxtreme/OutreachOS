import Papa from 'papaparse';
import { renderHook, act } from '@testing-library/react';

import { useCSVExport } from '@/lib/hooks/useCSVExport';

describe('useCSVExport errors', () => {
  it('captures export failures', () => {
    jest.spyOn(Papa, 'unparse').mockImplementation(() => {
      throw new Error('CSV generation failed');
    });

    const { result } = renderHook(() => useCSVExport());

    act(() => {
      result.current.exportToCSV([], 'broken.csv');
    });

    expect(result.current.error).toBe('CSV generation failed');
    jest.restoreAllMocks();
  });

  it('uses a fallback message for non-error throws', () => {
    jest.spyOn(Papa, 'unparse').mockImplementation(() => {
      throw 'bad export';
    });

    const { result } = renderHook(() => useCSVExport());

    act(() => {
      result.current.exportToCSV([], 'broken.csv');
    });

    expect(result.current.error).toBe('Failed to export CSV');
    jest.restoreAllMocks();
  });
});
