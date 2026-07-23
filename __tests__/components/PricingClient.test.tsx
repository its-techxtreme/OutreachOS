/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PricingClient } from '@/components/billing/PricingClient';
import { useAuth } from '@/lib/hooks/useAuth';
import { PREMIUM_REQUEST_EMAIL } from '@/lib/brand';

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/sound', () => ({
  playSound: jest.fn(),
}));

jest.mock('@/components/brand/BrandLockup', () => ({
  BrandLockup: () => <div data-testid="brand-lockup">OutreachOS</div>,
}));

jest.mock('@/components/site/SiteFooter', () => ({
  SiteFooter: () => <footer data-testid="site-footer" />,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
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

describe('PricingClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ plan: 'free' }),
    }) as jest.Mock;

    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'buyer@example.com',
        user_metadata: { username: 'buyer' },
      } as never,
      session: null,
      loading: false,
      error: null,
      isAuthenticated: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      linkGoogleIdentity: jest.fn(),
      signInAsDemo: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      clearError: jest.fn(),
    });
  });

  it('shows manual email fallback and copies the draft', async () => {
    render(<PricingClient />);

    expect(
      screen.getByRole('button', {
        name: /Mail app not opening\? Manually send this email/i,
      })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Mail app not opening\? Manually send this email/i,
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Send this email manually')).toBeInTheDocument();
    });

    expect(screen.getAllByText(PREMIUM_REQUEST_EMAIL).length).toBeGreaterThan(0);
    expect(screen.getByText(/Username: @buyer/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Copy full draft/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    const copied = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0] as string;
    expect(copied).toContain(`To: ${PREMIUM_REQUEST_EMAIL}`);
    expect(copied).toContain('Username: @buyer');
  });
});
