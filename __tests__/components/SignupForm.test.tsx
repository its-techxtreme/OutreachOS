import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SignupForm } from '@/components/auth/SignupForm';

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

const signUp = jest.fn();
const signInWithGoogle = jest.fn();

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp,
    signInWithGoogle,
    error: null,
    clearError: jest.fn(),
  }),
}));

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signup fields and Google option', () => {
    render(<SignupForm />);
    expect(screen.getByTestId('signup-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
    expect(screen.getByTestId('google-signup-button')).toBeInTheDocument();
    expect(screen.getByTestId('legal-consent-checkbox')).toBeInTheDocument();
  });

  it('blocks submit until legal consent is checked', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    expect(screen.getByTestId('signup-button')).toBeDisabled();
    expect(screen.getByTestId('google-signup-button')).toBeDisabled();

    await user.click(screen.getByTestId('legal-consent-checkbox'));
    expect(screen.getByTestId('signup-button')).not.toBeDisabled();
    expect(screen.getByTestId('google-signup-button')).not.toBeDisabled();
  });
});
