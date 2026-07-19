/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { AccountPanel } from '@/components/auth/AccountPanel';
import { useAuth } from '@/lib/hooks/useAuth';

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/sound', () => ({
  isSoundMuted: () => false,
  setSoundMuted: jest.fn(),
  playSound: jest.fn(),
}));

jest.mock('@/components/auth/MFASetup', () => ({
  MFASetup: () => <div data-testid="mfa-setup">MFA</div>,
}));

jest.mock('@/components/brand/BrandLockup', () => ({
  BrandLockup: () => <div data-testid="brand-lockup">OutreachOS</div>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AccountPanel', () => {
  const updatePassword = jest.fn();
  const signOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: false, quests: [], weekStart: '2026-07-13' }),
    }) as jest.Mock;
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      signInAsDemo: jest.fn(),
      signOut,
      resetPassword: jest.fn(),
      updatePassword,
      clearError: jest.fn(),
    });
  });

  it('shows profile and security for a normal user', () => {
    const user = {
      id: 'u1',
      email: 'rio@example.com',
      user_metadata: { username: 'rio_sketch' },
      app_metadata: { roles: ['user'] },
    } as never;

    render(<AccountPanel user={user} />);

    expect(screen.getByTestId('account-panel')).toBeInTheDocument();
    expect(screen.getByTestId('account-profile')).toHaveTextContent('@rio_sketch');
    expect(screen.getByTestId('account-profile')).toHaveTextContent('Member');
    expect(screen.getByTestId('change-password-form')).toBeInTheDocument();
    expect(screen.getByTestId('mfa-setup')).toBeInTheDocument();
    expect(screen.getByTestId('account-preferences')).toBeInTheDocument();
    expect(screen.getByTestId('account-legal')).toHaveTextContent('Privacy');
  });

  it('locks password and MFA for demo accounts', () => {
    const user = {
      id: 'd1',
      email: 'demo@example.com',
      user_metadata: { username: 'demouser' },
      app_metadata: { roles: ['demo'] },
    } as never;

    render(<AccountPanel user={user} />);

    expect(screen.getByTestId('account-security')).toHaveTextContent(
      /shared credentials/i
    );
    expect(screen.queryByTestId('change-password-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mfa-setup')).not.toBeInTheDocument();
  });

  it('signs out from the session section', () => {
    const user = {
      id: 'u1',
      email: 'rio@example.com',
      user_metadata: { username: 'rio' },
      app_metadata: { roles: ['user'] },
    } as never;

    render(<AccountPanel user={user} />);
    fireEvent.click(screen.getByTestId('account-sign-out'));
    expect(signOut).toHaveBeenCalled();
  });

  it('requires typing delete before permanent delete unlocks', () => {
    const user = {
      id: 'u1',
      email: 'rio@example.com',
      user_metadata: { username: 'rio' },
      app_metadata: { roles: ['user'] },
    } as never;

    render(<AccountPanel user={user} />);
    fireEvent.click(screen.getByTestId('account-delete-open'));
    expect(screen.getByTestId('account-delete-submit')).toBeDisabled();
    fireEvent.change(screen.getByTestId('account-delete-input'), {
      target: { value: 'delete' },
    });
    expect(screen.getByTestId('account-delete-submit')).not.toBeDisabled();
  });

  it('hides self-delete for demo accounts', () => {
    const user = {
      id: 'd1',
      email: 'demo@example.com',
      user_metadata: { username: 'demouser' },
      app_metadata: { roles: ['demo'] },
    } as never;

    render(<AccountPanel user={user} />);
    expect(screen.queryByTestId('account-delete-open')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-delete')).toHaveTextContent(
      /cannot be self-deleted/i
    );
  });
});
