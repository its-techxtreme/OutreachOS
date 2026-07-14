import { act, renderHook } from '@testing-library/react';

import { useLeadFilters } from '@/lib/hooks/useLeadFilters';
import { createMockLead, createMockLeads } from '@/__tests__/utils/lead-test-utils';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace,
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams('niche=SaaS'),
}));

describe('useLeadFilters URL sync', () => {
  beforeEach(() => {
    replace.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hydrates niche filters from the initial URL', () => {
    const { result } = renderHook(() => useLeadFilters(createMockLeads(10)));

    expect(result.current.selectedNiche).toBe('SaaS');
    expect(result.current.filteredCount).toBe(5);
  });

  it('does not rewrite the URL when filter params are unchanged', () => {
    const { result } = renderHook(() =>
      useLeadFilters([
        createMockLead({ niche: 'SaaS', country: 'USA' }),
        createMockLead({ id: 2, niche: 'FinTech', country: 'UK' }),
      ])
    );

    replace.mockClear();

    act(() => {
      result.current.setSelectedNiche('SaaS');
    });

    expect(replace).not.toHaveBeenCalled();
  });
});
