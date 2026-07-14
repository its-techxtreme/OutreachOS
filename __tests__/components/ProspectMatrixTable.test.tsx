jest.mock('react-window', () => ({
  List: ({
    rowCount,
    rowComponent: RowComponent,
    rowProps,
  }: {
    rowCount: number;
    rowComponent: React.ComponentType<Record<string, unknown>>;
    rowProps: Record<string, unknown>;
  }) => (
    <div data-testid="virtual-list" role="list">
      {Array.from({ length: Math.min(rowCount, 20) }).map((_, index) => (
        <RowComponent
          key={index}
          index={index}
          style={{ height: 56 }}
          ariaAttributes={{
            'aria-posinset': index + 1,
            'aria-setsize': rowCount,
            role: 'listitem',
          }}
          {...rowProps}
        />
      ))}
    </div>
  ),
}));

import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { ProspectMatrixTable } from '@/components/dashboard/ProspectMatrixTable';
import { createMockLead, createMockLeads } from '@/__tests__/utils/lead-test-utils';

expect.extend(toHaveNoViolations);

describe('ProspectMatrixTable', () => {
  const leads = createMockLeads(5);

  it('renders large datasets with virtualization wrapper', () => {
    render(
      <ProspectMatrixTable
        leads={createMockLeads(100)}
        onSort={jest.fn()}
      />
    );

    expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
  });

  it('sorting functionality triggers onSort callback', () => {
    const onSort = jest.fn();

    render(
      <ProspectMatrixTable leads={leads} sortBy="name" sortDirection="asc" onSort={onSort} />
    );

    fireEvent.click(screen.getByRole('button', { name: /business name/i }));
    expect(onSort).toHaveBeenCalledWith('name');
  });

  it('handles click-to-call phone links', () => {
    render(<ProspectMatrixTable leads={leads} onSort={jest.fn()} />);

    const phoneLink = screen.getAllByRole('link').find((link) =>
      link.getAttribute('href')?.startsWith('tel:')
    );

    expect(phoneLink).toBeTruthy();
    expect(phoneLink).toHaveAttribute('href', 'tel:+1-555-0000');
  });

  it('shows loading skeletons when isLoading=true', () => {
    render(
      <ProspectMatrixTable leads={[]} isLoading onSort={jest.fn()} />
    );

    expect(screen.getByTestId('prospect-table')).toBeInTheDocument();
    expect(screen.queryByTestId('virtual-list')).not.toBeInTheDocument();
  });

  it('renders placeholder when phone and address are missing', () => {
    const leads = [
      createMockLead({
        phone: null,
        address: null,
      }),
    ];

    render(<ProspectMatrixTable leads={leads} onSort={jest.fn()} />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows empty state when no leads are provided', () => {
    render(<ProspectMatrixTable leads={[]} onSort={jest.fn()} />);

    expect(
      screen.getByText('No leads match the current filters.')
    ).toBeInTheDocument();
  });

  it('invokes onRowClick when a row is activated', () => {
    const onRowClick = jest.fn();
    const leads = createMockLeads(1);

    render(
      <ProspectMatrixTable
        leads={leads}
        onSort={jest.fn()}
        onRowClick={onRowClick}
      />
    );

    fireEvent.click(screen.getByText('Business 1'));
    expect(onRowClick).toHaveBeenCalledWith(leads[0]);
  });

  it('invokes onRowClick when a row is activated with Enter', () => {
    const onRowClick = jest.fn();
    const leads = createMockLeads(1);

    render(
      <ProspectMatrixTable
        leads={leads}
        onSort={jest.fn()}
        onRowClick={onRowClick}
      />
    );

    fireEvent.keyDown(screen.getByText('Business 1'), {
      key: 'Enter',
    });

    expect(onRowClick).toHaveBeenCalledWith(leads[0]);
  });

  it('meets accessibility requirements', async () => {
    const { container } = render(
      <ProspectMatrixTable leads={leads} onSort={jest.fn()} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders spacious stacked cards in panel variant', () => {
    const detailed = [
      createMockLead({
        id: 99,
        name: 'Glossy Unisex Salon',
        niche: 'Saloons & Spas',
        country: 'India',
        phone: '+91 8976130911',
        address: 'Ramchandra Lane, Mumbai',
      }),
    ];

    render(
      <ProspectMatrixTable
        leads={detailed}
        onSort={jest.fn()}
        variant="panel"
      />
    );

    expect(screen.getByTestId('panel-lead-card')).toBeInTheDocument();
    expect(screen.getByText('Glossy Unisex Salon')).toBeInTheDocument();
    expect(screen.getByText('+91 8976130911')).toBeInTheDocument();
    expect(screen.getByText('Ramchandra Lane, Mumbai')).toBeInTheDocument();
    expect(screen.queryByTestId('virtual-list')).not.toBeInTheDocument();
  });
});
