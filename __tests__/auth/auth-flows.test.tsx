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
const mockReplace = jest.fn();
const mockSignIn = jest.fn();
const mockResetPassword = jest.fn();
const mockClearError = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: jest.fn(),
  }),
  usePathname: () => '/auth/login',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} src={props.src} />
  ),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
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

jest.mock('@/lib/sound', () => ({
  playSound: jest.fn(),
}));

const mockFetch = jest.fn();

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
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/mfa/setup')) {
        return {
          ok: true,
          json: async () => ({
            qrCode: 'data:image/png;base64,aaa',
            secret: 'SECRET',
            backupCodes: ['AAAA-BBBB'],
          }),
        };
      }
      if (url.includes('/api/auth/mfa/verify')) {
        return {
          ok: true,
          json: async () => ({ success: true }),
        };
      }
      if (url.includes('/api/auth/mfa/disable')) {
        return {
          ok: true,
          json: async () => ({ success: true }),
        };
      }
      return { ok: false, json: async () => ({ error: 'not mocked' }) };
    });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('successful login flow', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    await user.type(screen.getByTestId('email-input'), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePassword123!');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'admin@test.com',
        'SecurePassword123!'
      );
    });
  });

  it('successful login with username identifier', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByTestId('email-input'), 'rio_vault');
    await user.type(screen.getByLabelText(/password/i), 'SecurePassword123!');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'rio_vault',
        'SecurePassword123!'
      );
    });
  });

  it('failed login with invalid credentials', async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));
    authState.error = 'Invalid login credentials';

    const { rerender } = render(<LoginForm />);
    await user.type(screen.getByTestId('email-input'), 'invalid@test.com');
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
    mockReplace.mockClear();
    mockPush.mockClear();
  });

  it('redirects unauthenticated users from protected routes', async () => {
    render(
      <RouteGuard requireAuth>
        <div>Protected Content</div>
      </RouteGuard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('allows authenticated users to access protected routes', async () => {
    authState.session = { user: { id: 'test-user' } };
    authState.user = {
      id: 'test-user',
      email: 'test@test.com',
      app_metadata: { roles: ['admin'] },
      user_metadata: { username: 'admin_vault' },
    };

    render(
      <RouteGuard requireAuth>
        <div>Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects authenticated users without username to /auth/username', async () => {
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

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/username');
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows demo role without username', async () => {
    authState.session = { user: { id: 'demo-user' } };
    authState.user = {
      id: 'demo-user',
      email: 'demo@test.com',
      app_metadata: { roles: ['demo'] },
    };

    render(
      <RouteGuard requireAuth>
        <div>Protected Content</div>
      </RouteGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalledWith('/auth/username');
  });

  it('RBAC blocks users without required roles', async () => {
    authState.session = { user: { id: 'test-user' } };
    authState.user = {
      id: 'test-user',
      email: 'test@test.com',
      app_metadata: { roles: ['viewer'] },
      user_metadata: { username: 'viewer_user' },
    };

    render(
      <RouteGuard requireAuth roles={['admin']}>
        <div>Admin Only Content</div>
      </RouteGuard>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/unauthorized');
    });
  });
});
