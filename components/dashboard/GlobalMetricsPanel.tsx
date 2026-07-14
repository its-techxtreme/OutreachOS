'use client';

import { memo } from 'react';

import { MetricCard } from '@/components/dashboard/MetricCard';

export interface GlobalMetricsPanelProps {
  totalLeads: number;
  filteredLeads: number;
  activeSegments: number;
  isLoading?: boolean;
}

export const GlobalMetricsPanel = memo(function GlobalMetricsPanel({
  totalLeads,
  filteredLeads,
  activeSegments,
  isLoading = false,
}: GlobalMetricsPanelProps) {
  return (
    <section
      aria-labelledby="metrics-heading"
      data-testid="metrics-panel"
      className="w-full"
    >
      <h2 id="metrics-heading" className="sr-only">
        Lead Metrics
      </h2>
      <div
        role="group"
        aria-label="Lead statistics"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        <MetricCard
          label="Total Pool Depth"
          value={totalLeads}
          isLoading={isLoading}
        />
        <MetricCard
          label="Filter Matches"
          value={filteredLeads}
          isLoading={isLoading}
        />
        <MetricCard
          label="Active Segment Diversity"
          value={activeSegments}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
});
