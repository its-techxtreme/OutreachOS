import { render, screen } from '@testing-library/react';

import { MetricCard } from '@/components/dashboard/MetricCard';

describe('MetricCard', () => {
  it('renders increase and decrease change indicators', () => {
    const { rerender } = render(
      <MetricCard label="Growth" value={100} change={12} changeType="increase" />
    );

    expect(screen.getByText('+12%')).toBeInTheDocument();

    rerender(
      <MetricCard label="Growth" value={100} change={5} changeType="decrease" />
    );

    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('renders neutral change indicators', () => {
    render(
      <MetricCard label="Stable" value={50} change={0} changeType="neutral" />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
