'use client';

import { memo } from 'react';

import { MetricCard } from '@/components/dashboard/MetricCard';

import { emitTutorialAction } from '@/lib/demo/tutorial-bus';

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
      data-tutorial="metrics"
      className="w-full cursor-pointer rounded-md outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
      tabIndex={0}
      role="button"
      onClick={() => emitTutorialAction('view-metrics')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          emitTutorialAction('view-metrics');
        }
      }}
    >
      <h2 id="metrics-heading" className="sr-only">
        Lead Metrics
      </h2>
      <div
        role="group"
        aria-label="Lead statistics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
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
