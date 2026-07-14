import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { GlobalMetricsPanel } from '@/components/dashboard/GlobalMetricsPanel';

expect.extend(toHaveNoViolations);

describe('GlobalMetricsPanel', () => {
  it('renders all metric cards with correct data', () => {
    render(
      <GlobalMetricsPanel
        totalLeads={1248}
        filteredLeads={429}
        activeSegments={84}
      />
    );

    expect(screen.getByText('Total Pool Depth')).toBeInTheDocument();
    expect(screen.getByText('1,248')).toBeInTheDocument();
    expect(screen.getByText('Filter Matches')).toBeInTheDocument();
    expect(screen.getByText('429')).toBeInTheDocument();
    expect(screen.getByText('Active Segment Diversity')).toBeInTheDocument();
    expect(screen.getByText('84')).toBeInTheDocument();
  });

  it('renders loading skeleton for metric cards', () => {
    render(
      <GlobalMetricsPanel
        totalLeads={0}
        filteredLeads={0}
        activeSegments={0}
        isLoading
      />
    );

    expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(3);
  });

  it('updates metrics when props change', () => {
    const { rerender } = render(
      <GlobalMetricsPanel
        totalLeads={100}
        filteredLeads={50}
        activeSegments={5}
      />
    );

    expect(screen.getByText('100')).toBeInTheDocument();

    rerender(
      <GlobalMetricsPanel
        totalLeads={200}
        filteredLeads={75}
        activeSegments={8}
      />
    );

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('meets accessibility requirements', async () => {
    const { container } = render(
      <GlobalMetricsPanel
        totalLeads={1248}
        filteredLeads={429}
        activeSegments={84}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
