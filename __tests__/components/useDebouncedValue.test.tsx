import { renderHook, act, waitFor } from '@testing-library/react';

import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces search input correctly', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } }
    );

    expect(result.current).toBe('a');

    rerender({ value: 'alpha' });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current).toBe('alpha');
    });
  });
});
