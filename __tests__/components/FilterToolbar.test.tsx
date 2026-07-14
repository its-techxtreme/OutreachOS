import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { FilterToolbar } from '@/components/dashboard/FilterToolbar';

expect.extend(toHaveNoViolations);

const defaultProps = {
  searchQuery: '',
  onSearchChange: jest.fn(),
  selectedNiche: null,
  onNicheChange: jest.fn(),
  selectedCountry: null,
  onCountryChange: jest.fn(),
  availableNiches: ['SaaS', 'FinTech'],
  availableCountries: ['USA', 'UK'],
  filteredCount: 42,
  onExportCSV: jest.fn(),
  onClearFilters: jest.fn(),
};

describe('FilterToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates search input and calls onSearchChange', () => {
    render(<FilterToolbar {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Search leads'), {
      target: { value: 'alpha' },
    });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('alpha');
  });

  it('calls onNicheChange when a niche is selected', () => {
    render(<FilterToolbar {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Filter by niche'));
    fireEvent.click(screen.getByRole('option', { name: 'FinTech' }));

    expect(defaultProps.onNicheChange).toHaveBeenCalledWith('FinTech');
  });

  it('calls onCountryChange when a country is selected', () => {
    render(<FilterToolbar {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Filter by country'));
    fireEvent.click(screen.getByRole('option', { name: 'UK' }));

    expect(defaultProps.onCountryChange).toHaveBeenCalledWith('UK');
  });

  it('displays filtered count with live region', () => {
    render(<FilterToolbar {...defaultProps} filteredCount={1234} />);

    expect(screen.getByText('1,234 results')).toBeInTheDocument();
  });

  it('disables export when no filtered results exist', () => {
    render(<FilterToolbar {...defaultProps} filteredCount={0} />);

    expect(
      screen.getByLabelText('Export filtered leads to CSV')
    ).toBeDisabled();
  });

  it('handles CSV export with loading state', () => {
    const { rerender } = render(<FilterToolbar {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Export filtered leads to CSV'));
    expect(defaultProps.onExportCSV).toHaveBeenCalledTimes(1);

    rerender(<FilterToolbar {...defaultProps} isExporting filteredCount={10} />);
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
  });

  it('shows Import Excel when canImport is enabled', () => {
    const onImportFile = jest.fn();
    const { container } = render(
      <FilterToolbar
        {...defaultProps}
        canImport
        onImportFile={onImportFile}
      />
    );

    expect(
      screen.getByLabelText('Import leads from Excel')
    ).toBeInTheDocument();

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = new File(['fake'], 'leads.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImportFile).toHaveBeenCalledWith(file);
  });

  it('hides Import Excel when canImport is false', () => {
    render(<FilterToolbar {...defaultProps} />);
    expect(
      screen.queryByLabelText('Import leads from Excel')
    ).not.toBeInTheDocument();
  });

  it('shows clear filters when filters are active', () => {
    render(
      <FilterToolbar
        {...defaultProps}
        searchQuery="test"
        selectedNiche="SaaS"
      />
    );

    fireEvent.click(screen.getByLabelText('Clear all filters'));
    expect(defaultProps.onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('calls onStatusChange when a status is selected', () => {
    const onStatusChange = jest.fn();

    render(
      <FilterToolbar {...defaultProps} onStatusChange={onStatusChange} />
    );

    fireEvent.click(screen.getByLabelText('Filter by status'));
    fireEvent.click(screen.getByRole('option', { name: 'Converted' }));

    expect(onStatusChange).toHaveBeenCalledWith('Converted');
  });

  it('shows export progress bar while exporting', () => {
    render(
      <FilterToolbar
        {...defaultProps}
        isExporting
        exportProgress={50}
        filteredCount={10}
      />
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('meets accessibility requirements', async () => {
    const { container } = render(<FilterToolbar {...defaultProps} />);

    await waitFor(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
