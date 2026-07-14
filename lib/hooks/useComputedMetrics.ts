'use client';

import { useMemo } from 'react';

import { filterLeads, type LeadFilterState } from '@/lib/filter-leads';
import type { Lead } from '@/types/database.types';

export interface ComputedMetrics {
  totalLeads: number;
  filteredCount: number;
  segmentDiversity: number;
  conversionRate: number;
  recentLeads: number;
}

const RECENT_DAYS = 7;

function calculateConversionRate(leads: Lead[]): number {
  if (leads.length === 0) {
    return 0;
  }

  const converted = leads.filter((lead) => lead.status === 'Converted').length;
  return Math.round((converted / leads.length) * 1000) / 10;
}

function calculateRecentLeads(leads: Lead[]): number {
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

  return leads.filter((lead) => {
    const createdAt = new Date(lead.created_at).getTime();
    return createdAt >= cutoff;
  }).length;
}

function applyFilters(leads: Lead[], filters: LeadFilterState): Lead[] {
  return filterLeads(leads, filters);
}

export function useComputedMetrics(
  leads: Lead[],
  filters: LeadFilterState
): ComputedMetrics {
  return useMemo(() => {
    const filteredLeads = applyFilters(leads, filters);
    const uniqueNiches = new Set(filteredLeads.map((lead) => lead.niche));
    const uniqueCountries = new Set(filteredLeads.map((lead) => lead.country));

    return {
      totalLeads: leads.length,
      filteredCount: filteredLeads.length,
      segmentDiversity: uniqueNiches.size * uniqueCountries.size,
      conversionRate: calculateConversionRate(filteredLeads),
      recentLeads: calculateRecentLeads(filteredLeads),
    };
  }, [leads, filters]);
}
