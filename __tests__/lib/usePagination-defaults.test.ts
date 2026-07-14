import { renderHook } from '@testing-library/react';

import { usePagination } from '@/lib/hooks/usePagination';

describe('usePagination defaults', () => {
  it('uses the default page size when none is provided', () => {
    const { result } = renderHook(() => usePagination(250));

    expect(result.current.pageSize).toBe(100);
    expect(result.current.paginateItems(Array.from({ length: 250 }, (_, index) => index))).toHaveLength(100);
  });
});
