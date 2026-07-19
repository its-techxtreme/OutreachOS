import { fireEvent, render, screen } from '@testing-library/react';

import { DashboardView } from '@/components/dashboard/DashboardView';

jest.mock('@/lib/hooks/useLeads', () => ({
  useLeads: () => ({
    leads: [
      {
        id: 1,
        name: 'Alpha Pets',
        niche: 'Pet Groomer',
        country: 'Australia',
        phone: null,
        address: null,
        maps_url: 'https://maps.google.com/1',
        status: 'New',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    loading: false,
    error: null,
    refetch: jest.fn(),
    updateLeadStatus: jest.fn(),
  }),
}));

jest.mock('@/lib/hooks/useFilterOptions', () => ({
  useFilterOptions: () => ({
    niches: ['Pet Groomer'],
    countries: ['Australia'],
    error: null,
    refetchOptions: jest.fn(),
  }),
}));

jest.mock('@/components/quests/QuestBoard', () => ({
  QuestBoard: () => null,
}));

jest.mock('@/components/dashboard/LeadStickyNotePanel', () => ({
  LeadStickyNotePanel: () => null,
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'admin@outreachos.local' },
    signOut: jest.fn(),
    loading: false,
  }),
}));

jest.mock('@/components/dashboard/VectorVaultView', () => ({
  VectorVaultView: ({ leads }: { leads: unknown[] }) => (
    <div data-testid="vector-vault-view">vault:{leads.length}</div>
  ),
}));

jest.mock('@/components/dashboard/ProspectMatrixTable', () => ({
  ProspectMatrixTable: () => <div data-testid="prospect-matrix-table" />,
}));

describe('DashboardView vector toggle', () => {
  it('switches between table and vector vault views', () => {
    render(<DashboardView />);

    expect(screen.getByTestId('toggle-vector-view')).toHaveTextContent(
      /switch to vector view/i
    );
    expect(screen.queryByTestId('vector-vault-view')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toggle-vector-view'));

    expect(screen.getByTestId('vector-vault-view')).toHaveTextContent('vault:1');
    expect(screen.getByTestId('toggle-vector-view')).toHaveTextContent(
      /switch to table view/i
    );
  });
});
