/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoginForm } from '@/components/auth/LoginForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { MFASetup } from '@/components/auth/MFASetup';

const mockPush = jest.fn();
const mockSignIn = jest.fn();
const mockResetPassword = jest.fn();
const mockClearError = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/auth/login',
  useSearchParams: () => new URLSearchParams(),
}));

const authState = {
  user: null as null | { id: string; email: string; app_metadata?: { roles?: string[] }; user_metadata?: Record<string, unknown> },
  session: null as null | { user: { id: string } },
  loading: false,
  error: null as string | null,
  isAuthenticated: false,
  signIn: mockSignIn,
  signUp: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInAsDemo: jest.fn(),
  signOut: jest.fn(),
  resetPassword: mockResetPassword,
  updatePassword: jest.fn(),
  clearError: mockClearError,
};

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => authState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/lib/auth/mfa', () => ({
  MFAService: jest.fn().mockImplementation(() => ({
    enableMFA: jest.fn().mockResolvedValue({
      secret: 'SECRET',
      qrCode: 'data:image/png;base64,aaa',
    }),
    verifyAndEnableMFA: jest.fn().mockResolvedValue(true),
    disableMFA: jest.fn().mockResolvedValue(true),
  })),
}));

describe('Authentication Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authState.user = null;
    authState.session = null;
    authState.loading = false;
    authState.error = null;
    authState.isAuthenticated = false;
    mockSignIn.mockResolvedValue(undefined);
    mockResetPassword.mockResolvedValue(undefined);
  });

  it('successful login flow', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePassword123!');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'admin@test.com',
        'SecurePassword123!'
      );
    });
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('failed login with invalid credentials', async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));
    authState.error = 'Invalid login credentials';

    const { rerender } = render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), 'invalid@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByTestId('login-button'));

    rerender(<LoginForm />);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('password reset flow', async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm />);

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('admin@test.com');
      expect(
        screen.getByText(/password reset email sent/i)
      ).toBeInTheDocument();
    });
  });

  it('MFA setup and verification', async () => {
    const user = userEvent.setup();
    authState.user = {
      id: 'test-user-id',
      email: 'test@test.com',
      user_metadata: { mfa_enabled: false },
    };

    render(<MFASetup user={{ id: 'test-user-id', email: 'test@test.com' }} />);

    await user.click(screen.getByRole('button', { name: /enable mfa/i }));

    await waitFor(() => {
      expect(screen.getByAltText(/mfa qr code/i)).toBeInTheDocument();
      expect(screen.getByText('Scan QR code')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/mfa enabled successfully/i)
      ).toBeInTheDocument();
    });
  });
});

describe('Route Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authState.loading = false;
    authState.user = null;
    authState.session = null;
  });

  it('redirects unauthenticated users from protected routes', async () => {
    render(
      <RouteGuard requireAuth>
        <div>Protected Content</div>
      </RouteGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('allows authenticated users to access protected routes', async () => {
    authState.session = { user: { id: 'test-user' } };
    authState.user = {
      id: 'test-user',
      email: 'test@test.com',
      app_metadata: { roles: ['admin'] },
    };

    render(
      <RouteGuard requireAuth>
        <div>Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('RBAC blocks users without required roles', async () => {
    authState.session = { user: { id: 'test-user' } };
    authState.user = {
      id: 'test-user',
      email: 'test@test.com',
      app_metadata: { roles: ['viewer'] },
    };

    render(
      <RouteGuard requireAuth roles={['admin']}>
        <div>Admin Only Content</div>
      </RouteGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/unauthorized');
    });
  });
});
