/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DEMO_TUTORIAL_TIP_KEY,
  NewAccountDemoTip,
} from '@/components/dashboard/NewAccountDemoTip';

const authState = {
  user: null as null | {
    id: string;
    email?: string;
    app_metadata?: { roles?: string[] };
  },
};

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} src={props.src} />
  ),
}));

describe('NewAccountDemoTip', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState.user = {
      id: 'user-1',
      email: 'new@example.com',
      app_metadata: { roles: ['user'] },
    };
  });

  it('shows tip when session flag is set for a non-demo user', async () => {
    sessionStorage.setItem(DEMO_TUTORIAL_TIP_KEY, '1');
    render(<NewAccountDemoTip />);

    expect(await screen.findByTestId('new-account-demo-tip')).toBeInTheDocument();
    expect(screen.getByText(/tutorial of how OutreachOS works/i)).toBeInTheDocument();
  });

  it('does not show for demo users', () => {
    sessionStorage.setItem(DEMO_TUTORIAL_TIP_KEY, '1');
    authState.user = {
      id: 'demo-1',
      app_metadata: { roles: ['demo'] },
    };
    render(<NewAccountDemoTip />);
    expect(screen.queryByTestId('new-account-demo-tip')).not.toBeInTheDocument();
  });

  it('dismisses and clears the session flag', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(DEMO_TUTORIAL_TIP_KEY, '1');
    render(<NewAccountDemoTip />);

    await screen.findByTestId('new-account-demo-tip');
    await user.click(screen.getByTestId('dismiss-demo-tip'));

    await waitFor(() => {
      expect(screen.queryByTestId('new-account-demo-tip')).not.toBeInTheDocument();
    });
    expect(sessionStorage.getItem(DEMO_TUTORIAL_TIP_KEY)).toBeNull();
  });
});
