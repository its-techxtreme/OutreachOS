'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  countActiveSegments,
  filterLeads,
  getUniqueValues,
  LEAD_STATUSES,
  sortLeads,
  type LeadFilterState,
  type LeadSortColumn,
  type SortDirection,
} from '@/lib/filter-leads';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import type { Lead, LeadStatus } from '@/types/database.types';

function parseDateParam(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateParam(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return date.toISOString().split('T')[0] ?? null;
}

function parseStatusParam(value: string | null): LeadStatus | null {
  if (!value || !LEAD_STATUSES.includes(value as LeadStatus)) {
    return null;
  }

  return value as LeadStatus;
}

function normalizeSearchQuery(value: string | null): string {
  if (!value || value === 'undefined' || value === 'null') {
    return '';
  }

  return value;
}

function parseFiltersFromParams(
  searchParams: URLSearchParams
): LeadFilterState {
  return {
    searchQuery: normalizeSearchQuery(searchParams.get('q')),
    selectedNiche: searchParams.get('niche'),
    selectedCountry: searchParams.get('country'),
    selectedStatus: parseStatusParam(searchParams.get('status')),
    dateRange: {
      start: parseDateParam(searchParams.get('startDate')),
      end: parseDateParam(searchParams.get('endDate')),
    },
  };
}

function buildParamsFromFilters(filters: LeadFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.searchQuery.trim() && filters.searchQuery !== 'undefined') {
    params.set('q', filters.searchQuery.trim());
  }

  if (filters.selectedNiche) {
    params.set('niche', filters.selectedNiche);
  }

  if (filters.selectedCountry) {
    params.set('country', filters.selectedCountry);
  }

  if (filters.selectedStatus) {
    params.set('status', filters.selectedStatus);
  }

  const startDate = formatDateParam(filters.dateRange.start);
  if (startDate) {
    params.set('startDate', startDate);
  }

  const endDate = formatDateParam(filters.dateRange.end);
  if (endDate) {
    params.set('endDate', endDate);
  }

  return params;
}

export interface UseLeadFiltersResult {
  searchQuery: string;
  debouncedSearchQuery: string;
  selectedNiche: string | null;
  selectedCountry: string | null;
  selectedStatus: LeadStatus | null;
  dateRange: LeadFilterState['dateRange'];
  sortBy: LeadSortColumn;
  sortDirection: SortDirection;
  filteredLeads: Lead[];
  filteredCount: number;
  activeSegments: number;
  filterState: LeadFilterState;
  availableNiches: string[];
  availableCountries: string[];
  setSearchQuery: (query: string) => void;
  setSelectedNiche: (niche: string | null) => void;
  setSelectedCountry: (country: string | null) => void;
  setSelectedStatus: (status: LeadStatus | null) => void;
  setDateRange: (
    range:
      | LeadFilterState['dateRange']
      | ((previous: LeadFilterState['dateRange']) => LeadFilterState['dateRange'])
  ) => void;
  clearFilters: () => void;
  toggleSort: (column: LeadSortColumn) => void;
}

export function useLeadFilters(leads: Lead[]): UseLeadFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialFilters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams]
  );

  const [searchQuery, setSearchQueryState] = useState(initialFilters.searchQuery);
  const [selectedNiche, setSelectedNicheState] = useState<string | null>(
    initialFilters.selectedNiche
  );
  const [selectedCountry, setSelectedCountryState] = useState<string | null>(
    initialFilters.selectedCountry
  );
  const [selectedStatus, setSelectedStatusState] = useState<LeadStatus | null>(
    initialFilters.selectedStatus
  );
  const [dateRange, setDateRangeState] = useState(initialFilters.dateRange);
  const [sortBy, setSortBy] = useState<LeadSortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const filterState = useMemo(
    (): LeadFilterState => ({
      searchQuery: debouncedSearchQuery,
      selectedNiche,
      selectedCountry,
      selectedStatus,
      dateRange,
    }),
    [
      dateRange,
      debouncedSearchQuery,
      selectedCountry,
      selectedNiche,
      selectedStatus,
    ]
  );

  const syncUrl = useCallback(
    (filters: LeadFilterState) => {
      const nextParams = buildParamsFromFilters(filters);
      const nextQuery = nextParams.toString();
      const currentQuery = searchParams.toString();

      if (nextQuery === currentQuery) {
        return;
      }

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    syncUrl(filterState);
  }, [filterState, syncUrl]);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setSelectedNiche = useCallback((niche: string | null) => {
    setSelectedNicheState(niche);
  }, []);

  const setSelectedCountry = useCallback((country: string | null) => {
    setSelectedCountryState(country);
  }, []);

  const setSelectedStatus = useCallback((status: LeadStatus | null) => {
    setSelectedStatusState(status);
  }, []);

  const setDateRange = useCallback(
    (
      range:
        | LeadFilterState['dateRange']
        | ((previous: LeadFilterState['dateRange']) => LeadFilterState['dateRange'])
    ) => {
      setDateRangeState((previous) =>
        typeof range === 'function' ? range(previous) : range
      );
    },
    []
  );

  const clearFilters = useCallback(() => {
    setSearchQueryState('');
    setSelectedNicheState(null);
    setSelectedCountryState(null);
    setSelectedStatusState(null);
    setDateRangeState({ start: null, end: null });
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const toggleSort = useCallback((column: LeadSortColumn) => {
    setSortBy((currentColumn) => {
      if (currentColumn === column) {
        setSortDirection((currentDirection) =>
          currentDirection === 'asc' ? 'desc' : 'asc'
        );
        return currentColumn;
      }

      setSortDirection('asc');
      return column;
    });
  }, []);

  const filteredLeads = useMemo(() => {
    const filtered = filterLeads(leads, filterState);
    return sortLeads(filtered, sortBy, sortDirection);
  }, [filterState, leads, sortBy, sortDirection]);

  const availableNiches = useMemo(() => getUniqueValues(leads, 'niche'), [leads]);
  const availableCountries = useMemo(
    () => getUniqueValues(leads, 'country'),
    [leads]
  );

  return {
    searchQuery,
    debouncedSearchQuery,
    selectedNiche,
    selectedCountry,
    selectedStatus,
    dateRange,
    sortBy,
    sortDirection,
    filteredLeads,
    filteredCount: filteredLeads.length,
    activeSegments: countActiveSegments(filteredLeads),
    filterState,
    availableNiches,
    availableCountries,
    setSearchQuery,
    setSelectedNiche,
    setSelectedCountry,
    setSelectedStatus,
    setDateRange,
    clearFilters,
    toggleSort,
  };
}
