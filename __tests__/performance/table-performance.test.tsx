import { render } from '@testing-library/react';

import { ProspectMatrixTable } from '@/components/dashboard/ProspectMatrixTable';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

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
      {Array.from({ length: Math.min(rowCount, 25) }).map((_, index) => (
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

describe('Table Performance', () => {
  it('handles 10k rows without performance degradation', () => {
    const leads = createMockLeads(10_000);
    const start = performance.now();

    render(<ProspectMatrixTable leads={leads} onSort={jest.fn()} />);

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
