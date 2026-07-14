import { render, screen } from '@testing-library/react';

import { DashboardView } from '@/components/dashboard/DashboardView';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

jest.mock('@/lib/hooks/useLeads', () => ({
  useLeads: () => ({
    leads: createMockLeads(5),
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/lib/hooks/useFilterOptions', () => ({
  useFilterOptions: () => ({
    niches: ['SaaS', 'FinTech'],
    countries: ['USA', 'UK'],
    loading: false,
    error: null,
    refetchOptions: jest.fn(),
  }),
}));

describe('Dashboard Integration', () => {
  it('renders complete dashboard workflow components', () => {
    render(<DashboardView />);

    expect(screen.getByTestId('metrics-panel')).toBeInTheDocument();
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('prospect-table')).toBeInTheDocument();
    expect(screen.getByText('OutreachOS')).toBeInTheDocument();
  });
});
