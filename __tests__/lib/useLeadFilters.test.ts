import { act, renderHook } from '@testing-library/react';

import { useLeadFilters } from '@/lib/hooks/useLeadFilters';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

describe('useLeadFilters', () => {
  const leads = createMockLeads(10);

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('filters leads by niche selection', () => {
    const { result } = renderHook(() => useLeadFilters(leads));

    act(() => {
      result.current.setSelectedNiche('SaaS');
    });

    expect(result.current.filteredCount).toBe(5);
    expect(
      result.current.filteredLeads.every((lead) => lead.niche === 'SaaS')
    ).toBe(true);
  });

  it('filters leads by country selection', () => {
    const { result } = renderHook(() => useLeadFilters(leads));

    act(() => {
      result.current.setSelectedCountry('UK');
    });

    expect(result.current.filteredCount).toBeGreaterThan(0);
    expect(
      result.current.filteredLeads.every((lead) => lead.country === 'UK')
    ).toBe(true);
  });

  it('filters leads by status selection', () => {
    const statusLeads = [
      ...leads.slice(0, 5).map((lead) => ({ ...lead, status: 'New' as const })),
      ...leads.slice(5).map((lead) => ({ ...lead, status: 'Converted' as const })),
    ];

    const { result } = renderHook(() => useLeadFilters(statusLeads));

    act(() => {
      result.current.setSelectedStatus('Converted');
    });

    expect(result.current.filteredCount).toBe(5);
    expect(
      result.current.filteredLeads.every((lead) => lead.status === 'Converted')
    ).toBe(true);
  });

  it('clears all filters without restoring debounced search', () => {
    const { result } = renderHook(() => useLeadFilters(leads));

    act(() => {
      result.current.setSearchQuery('test');
      result.current.setSelectedStatus('Converted');
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.debouncedSearchQuery).toBe('');
    expect(result.current.selectedNiche).toBeNull();
    expect(result.current.selectedStatus).toBeNull();
    expect(result.current.dateRange.start).toBeNull();
    expect(result.current.filteredCount).toBe(10);
  });

  it('switches sort column when sorting a new field', () => {
    const { result } = renderHook(() => useLeadFilters(leads));

    act(() => {
      result.current.toggleSort('name');
    });

    expect(result.current.sortBy).toBe('name');
    expect(result.current.sortDirection).toBe('asc');

    act(() => {
      result.current.toggleSort('country');
    });

    expect(result.current.sortBy).toBe('country');
    expect(result.current.sortDirection).toBe('asc');
  });

  it('toggles sort direction for the same column', () => {
    const { result } = renderHook(() => useLeadFilters(leads));

    act(() => {
      result.current.toggleSort('name');
    });

    expect(result.current.sortBy).toBe('name');
    expect(result.current.sortDirection).toBe('asc');

    act(() => {
      result.current.toggleSort('name');
    });

    expect(result.current.sortDirection).toBe('desc');
  });
});
