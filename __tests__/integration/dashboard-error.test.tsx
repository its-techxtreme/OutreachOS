jest.mock('@/lib/hooks/useLeads', () => ({
  useLeads: () => ({
    leads: [],
    loading: false,
    error: 'Failed to fetch leads',
    refetch: jest.fn(),
  }),
}));

jest.mock('@/lib/hooks/useFilterOptions', () => ({
  useFilterOptions: () => ({
    niches: [],
    countries: [],
    loading: false,
    error: null,
    refetchOptions: jest.fn(),
  }),
}));

import { render, screen } from '@testing-library/react';

import { DashboardView } from '@/components/dashboard/DashboardView';

describe('DashboardView error state', () => {
  it('renders API error alerts', () => {
    render(<DashboardView />);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch leads');
  });
});
