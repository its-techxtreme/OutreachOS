'use client';

import { useCallback, useEffect, useState } from 'react';

interface UseFilterOptionsResult {
  niches: string[];
  countries: string[];
  loading: boolean;
  error: string | null;
  refetchOptions: () => Promise<void>;
}

export function useFilterOptions(): UseFilterOptionsResult {
  const [niches, setNiches] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilterOptions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/leads/filter-options');

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to fetch filter options');
      }

      const payload = (await response.json()) as {
        niches: string[];
        countries: string[];
      };

      setNiches(payload.niches);
      setCountries(payload.countries);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to fetch filter options'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data hooks must fetch on mount
    void fetchFilterOptions();
  }, [fetchFilterOptions]);

  return {
    niches,
    countries,
    loading,
    error,
    refetchOptions: fetchFilterOptions,
  };
}
