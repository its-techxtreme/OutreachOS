import { renderHook } from '@testing-library/react';

import { useComputedMetrics } from '@/lib/hooks/useComputedMetrics';
import type { LeadFilterState } from '@/lib/filter-leads';
import { createMockLead } from '@/__tests__/utils/lead-test-utils';

const emptyFilters: LeadFilterState = {
  searchQuery: '',
  selectedNiche: null,
  selectedCountry: null,
  selectedStatus: null,
  dateRange: { start: null, end: null },
};

describe('useComputedMetrics', () => {
  it('computes conversion rate and segment diversity', () => {
    const leads = [
      createMockLead({ id: 1, status: 'Converted', niche: 'SaaS', country: 'USA' }),
      createMockLead({ id: 2, status: 'New', niche: 'FinTech', country: 'UK' }),
    ];

    const { result } = renderHook(() => useComputedMetrics(leads, emptyFilters));

    expect(result.current.totalLeads).toBe(2);
    expect(result.current.filteredCount).toBe(2);
    expect(result.current.conversionRate).toBe(50);
    expect(result.current.segmentDiversity).toBe(4);
  });
});
