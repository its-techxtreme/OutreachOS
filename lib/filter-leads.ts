import type { Lead, LeadStatus } from '@/types/database.types';

export type SortDirection = 'asc' | 'desc';

export type LeadSortColumn = keyof Pick<
  Lead,
  'name' | 'niche' | 'country' | 'phone' | 'address' | 'status' | 'created_at'
>;

export interface LeadFilterState {
  searchQuery: string;
  selectedNiche: string | null;
  selectedCountry: string | null;
  selectedStatus: LeadStatus | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Called',
  'No Answer',
  'Callback',
  'Replied',
  'Converted',
  'Archived',
];

export function fuzzyMatch(text: string, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();
  const tokens = normalizedQuery.split(/\s+/);

  return tokens.every((token) => normalizedText.includes(token));
}

export function filterLeads(
  leads: Lead[],
  filters: LeadFilterState
): Lead[] {
  const {
    searchQuery,
    selectedNiche,
    selectedCountry,
    selectedStatus,
    dateRange,
  } = filters;

  return leads.filter((lead) => {
    if (selectedNiche && lead.niche !== selectedNiche) {
      return false;
    }

    if (selectedCountry && lead.country !== selectedCountry) {
      return false;
    }

    if (selectedStatus && lead.status !== selectedStatus) {
      return false;
    }

    if (dateRange.start) {
      const start = dateRange.start.getTime();
      if (new Date(lead.created_at).getTime() < start) {
        return false;
      }
    }

    if (dateRange.end) {
      const end = dateRange.end.getTime();
      if (new Date(lead.created_at).getTime() > end) {
        return false;
      }
    }

    if (!searchQuery.trim()) {
      return true;
    }

    const searchable = [
      lead.name,
      lead.niche,
      lead.country,
      lead.phone ?? '',
      lead.address ?? '',
      lead.status,
    ].join(' ');

    return fuzzyMatch(searchable, searchQuery);
  });
}

export function sortLeads(
  leads: Lead[],
  sortBy: LeadSortColumn,
  sortDirection: SortDirection
): Lead[] {
  const sorted = [...leads].sort((a, b) => {
    const aValue = a[sortBy] ?? '';
    const bValue = b[sortBy] ?? '';

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }

    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }

    return 0;
  });

  return sorted;
}

export function getUniqueValues(leads: Lead[], key: 'niche' | 'country'): string[] {
  const values = new Set<string>();

  for (const lead of leads) {
    values.add(lead[key]);
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function countActiveSegments(leads: Lead[]): number {
  const niches = new Set(leads.map((lead) => lead.niche));
  return niches.size;
}
