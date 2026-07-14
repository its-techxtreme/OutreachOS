import { fireEvent, render, screen } from '@testing-library/react';

import { FilterToolbar } from '@/components/dashboard/FilterToolbar';

const defaultProps = {
  searchQuery: '',
  onSearchChange: jest.fn(),
  selectedNiche: null,
  onNicheChange: jest.fn(),
  selectedCountry: null,
  onCountryChange: jest.fn(),
  availableNiches: ['SaaS'],
  availableCountries: ['USA'],
  filteredCount: 10,
  onExportCSV: jest.fn(),
  onClearFilters: jest.fn(),
};

describe('FilterToolbar date filters', () => {
  it('calls date range change handlers', () => {
    const onDateRangeStartChange = jest.fn();
    const onDateRangeEndChange = jest.fn();

    render(
      <FilterToolbar
        {...defaultProps}
        onDateRangeStartChange={onDateRangeStartChange}
        onDateRangeEndChange={onDateRangeEndChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Filter from date'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Filter to date'), {
      target: { value: '2026-12-31' },
    });

    expect(onDateRangeStartChange).toHaveBeenCalledWith('2026-01-01');
    expect(onDateRangeEndChange).toHaveBeenCalledWith('2026-12-31');
  });

  it('shows clear button when status and date filters are active', () => {
    render(
      <FilterToolbar
        {...defaultProps}
        selectedStatus="New"
        dateRangeStart="2026-01-01"
      />
    );

    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
  });
});
