import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DashboardView } from '@/components/dashboard/DashboardView';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

jest.mock('@/lib/hooks/useLeads', () => ({
  useLeads: () => ({
    leads: createMockLeads(150),
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

describe('DashboardView integration', () => {
  it('renders pagination controls for large datasets', () => {
    render(<DashboardView />);

    expect(screen.getByText('150 results')).toBeInTheDocument();
    expect(screen.getByLabelText('Lead table pagination')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('filters leads and resets pagination when niche changes', async () => {
    render(<DashboardView />);

    fireEvent.click(screen.getByLabelText('Filter by niche'));
    fireEvent.click(screen.getByRole('option', { name: 'SaaS' }));

    await waitFor(() => {
      expect(screen.getByText('75 results')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Lead table pagination')).not.toBeInTheDocument();
  });

  it('exports filtered leads from the toolbar', () => {
    const click = jest.fn();
    const createObjectURL = jest.fn(() => 'blob:test');
    const revokeObjectURL = jest.fn();

    Object.defineProperty(global.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);

      if (tagName === 'a') {
        element.click = click;
      }

      return element;
    });

    render(<DashboardView />);
    fireEvent.click(screen.getByLabelText('Export filtered leads to CSV'));

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it('updates date range filters', () => {
    render(<DashboardView />);

    fireEvent.change(screen.getByLabelText('Filter from date'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Filter to date'), {
      target: { value: '2026-12-31' },
    });

    expect(screen.getByLabelText('Filter from date')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('Filter to date')).toHaveValue('2026-12-31');
  });
});
