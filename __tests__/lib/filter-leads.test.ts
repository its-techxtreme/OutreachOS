import {
  countActiveSegments,
  filterLeads,
  fuzzyMatch,
  getUniqueValues,
  sortLeads,
  type LeadFilterState,
} from '@/lib/filter-leads';
import { createMockLead, createMockLeads } from '@/__tests__/utils/lead-test-utils';

const emptyFilters: LeadFilterState = {
  searchQuery: '',
  selectedNiche: null,
  selectedCountry: null,
  selectedStatus: null,
  dateRange: { start: null, end: null },
};

describe('filter-leads utilities', () => {
  const leads = [
    createMockLead({ id: 1, name: 'Alpha SaaS', niche: 'SaaS', country: 'USA' }),
    createMockLead({ id: 2, name: 'Beta FinTech', niche: 'FinTech', country: 'UK' }),
    createMockLead({ id: 3, name: 'Gamma Health', niche: 'Healthcare', country: 'USA' }),
  ];

  it('matches fuzzy search tokens across lead fields', () => {
    expect(fuzzyMatch('Alpha SaaS USA', 'alpha usa')).toBe(true);
    expect(fuzzyMatch('Alpha SaaS USA', 'beta')).toBe(false);
  });

  it('returns true for empty search queries', () => {
    expect(fuzzyMatch('anything', '   ')).toBe(true);
  });

  it('sorts nullable phone values consistently', () => {
    const sorted = sortLeads(
      [
        createMockLead({ id: 1, phone: null }),
        createMockLead({ id: 2, phone: '+1-555-0100' }),
      ],
      'phone',
      'asc'
    );

    expect(sorted[0]?.phone).toBeNull();
  });

  it('returns zero when sort values are equal', () => {
    const tiedLeads = [
      createMockLead({ id: 1, name: 'Same' }),
      createMockLead({ id: 2, name: 'Same' }),
    ];

    const sorted = sortLeads(tiedLeads, 'name', 'asc');
    expect(sorted).toHaveLength(2);
  });

  it('filters by search query only', () => {
    const filtered = filterLeads(leads, {
      ...emptyFilters,
      searchQuery: 'Alpha',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe('Alpha SaaS');
  });

  it('filters by country without a search query', () => {
    const filtered = filterLeads(leads, {
      ...emptyFilters,
      selectedCountry: 'USA',
    });

    expect(filtered.every((lead) => lead.country === 'USA')).toBe(true);
  });

  it('filters by niche, country, and search query', () => {
    const filtered = filterLeads(leads, {
      ...emptyFilters,
      searchQuery: 'alpha',
      selectedNiche: 'SaaS',
      selectedCountry: 'USA',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe('Alpha SaaS');
  });

  it('sorts leads ascending and descending', () => {
    const ascending = sortLeads(leads, 'name', 'asc');
    expect(ascending[0]?.name).toBe('Alpha SaaS');

    const descending = sortLeads(leads, 'name', 'desc');
    expect(descending[0]?.name).toBe('Gamma Health');
  });

  it('returns unique niches and countries', () => {
    expect(getUniqueValues(leads, 'niche')).toEqual([
      'FinTech',
      'Healthcare',
      'SaaS',
    ]);
    expect(getUniqueValues(leads, 'country')).toEqual(['UK', 'USA']);
  });

  it('filters by status and date range', () => {
    const filtered = filterLeads(
      [
        createMockLead({
          id: 1,
          status: 'Converted',
          created_at: '2026-07-01T00:00:00.000Z',
        }),
        createMockLead({
          id: 2,
          status: 'New',
          created_at: '2026-06-01T00:00:00.000Z',
        }),
      ],
      {
        ...emptyFilters,
        selectedStatus: 'Converted',
        dateRange: {
          start: new Date('2026-06-15T00:00:00.000Z'),
          end: new Date('2026-07-15T00:00:00.000Z'),
        },
      }
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.status).toBe('Converted');
  });

  it('counts active segments in filtered results', () => {
    expect(countActiveSegments(createMockLeads(10))).toBe(2);
  });
});
