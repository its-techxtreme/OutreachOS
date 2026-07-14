import { renderHook, act } from '@testing-library/react';

import { useCSVExport } from '@/lib/hooks/useCSVExport';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

describe('useCSVExport', () => {
  it('exports filtered leads to a downloadable CSV blob', () => {
    const click = jest.fn();
    const createObjectURL = jest.fn(() => 'blob:test');
    const revokeObjectURL = jest.fn();

    Object.defineProperty(global.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });

    const appendChild = jest.spyOn(document.body, 'appendChild');
    const removeChild = jest.spyOn(document.body, 'removeChild');
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);

      if (tagName === 'a') {
        element.click = click;
      }

      return element;
    });

    const { result } = renderHook(() => useCSVExport());

    act(() => {
      result.current.exportToCSV(createMockLeads(3), 'test-export.csv');
    });

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});
