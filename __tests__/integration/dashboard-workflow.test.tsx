import { render, screen } from '@testing-library/react';

import { DashboardView } from '@/components/dashboard/DashboardView';
import { createMockLeads } from '@/__tests__/utils/lead-test-utils';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} src={props.src} />
  ),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      email: 't@test.com',
      app_metadata: { roles: ['user'] },
      user_metadata: { username: 'tester' },
    },
    signOut: jest.fn(),
    loading: false,
  }),
}));

jest.mock('@/lib/sound', () => ({
  playSound: jest.fn(),
  isSoundMuted: jest.fn(() => false),
  setSoundMuted: jest.fn(),
}));

jest.mock('@/lib/hooks/useLeads', () => ({
  useLeads: () => ({
    leads: createMockLeads(5),
    loading: false,
    error: null,
    refetch: jest.fn(),
    updateLeadStatus: jest.fn(),
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

jest.mock('@/components/quests/QuestBoard', () => ({
  QuestBoard: () => null,
}));

jest.mock('@/components/dashboard/LeadStickyNotePanel', () => ({
  LeadStickyNotePanel: () => null,
}));

describe('Dashboard Integration', () => {
  it('renders complete dashboard workflow components', () => {
    render(<DashboardView />);

    expect(screen.getByTestId('metrics-panel')).toBeInTheDocument();
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('prospect-table')).toBeInTheDocument();
    expect(screen.getByLabelText('OutreachOS')).toBeInTheDocument();
  });
});