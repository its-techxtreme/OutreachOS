import { act, renderHook } from '@testing-library/react';

import { usePagination } from '@/lib/hooks/usePagination';

describe('usePagination', () => {
  it('paginates items for the current page', () => {
    const items = Array.from({ length: 250 }, (_, index) => index + 1);
    const { result } = renderHook(() => usePagination(items.length, 100));

    expect(result.current.paginateItems(items)).toHaveLength(100);
    expect(result.current.paginateItems(items)[0]).toBe(1);
  });

  it('moves to the next page', () => {
    const { result } = renderHook(() => usePagination(250, 100));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPreviousPage).toBe(true);
  });

  it('clamps page changes to valid bounds', () => {
    const { result } = renderHook(() => usePagination(150, 100));

    act(() => {
      result.current.setPage(99);
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('clamps the current page when total count shrinks', () => {
    const { result, rerender } = renderHook(
      ({ totalCount }) => usePagination(totalCount, 100),
      { initialProps: { totalCount: 250 } }
    );

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.currentPage).toBe(3);

    rerender({ totalCount: 50 });

    expect(result.current.currentPage).toBe(1);
  });

  it('does not move below page 1 when previousPage is called', () => {
    const { result } = renderHook(() => usePagination(250, 100));

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.currentPage).toBe(1);
  });
});
