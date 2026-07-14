import { renderHook } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams('q=undefined'),
}));

import { useLeadFilters } from '@/lib/hooks/useLeadFilters';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

describe('useLeadFilters URL sanitization', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ignores invalid q values from the URL', () => {
    const { result } = renderHook(() => useLeadFilters(createMockLeads(3)));

    expect(result.current.searchQuery).toBe('');
  });
});
