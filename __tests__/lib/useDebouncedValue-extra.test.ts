import { renderHook, act } from '@testing-library/react';

import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

describe('useDebouncedValue additional branches', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates immediately when the value is cleared', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'active' } }
    );

    rerender({ value: '' });

    expect(result.current).toBe('');
  });

  it('debounces non-string values on the configured delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 1 } }
    );

    rerender({ value: 2 });

    expect(result.current).toBe(1);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(2);
  });

  it('cleans up pending timers when the value changes quickly', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    rerender({ value: 'third' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('third');
  });
});
