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
    leads: [],
    loading: false,
    error: 'Failed to fetch leads',
    refetch: jest.fn(),
    updateLeadStatus: jest.fn(),
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

jest.mock('@/components/quests/QuestBoard', () => ({
  QuestBoard: () => null,
}));

jest.mock('@/components/dashboard/LeadStickyNotePanel', () => ({
  LeadStickyNotePanel: () => null,
}));


import { render, screen } from '@testing-library/react';

import { DashboardView } from '@/components/dashboard/DashboardView';

describe('DashboardView error state', () => {
  it('renders API error alerts', () => {
    render(<DashboardView />);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch leads');
  });
});
