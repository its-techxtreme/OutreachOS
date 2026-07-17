import { render, screen } from '@testing-library/react';

import { SignupForm } from '@/components/auth/SignupForm';

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: jest.fn(),
    signInWithGoogle: jest.fn(),
    error: null,
    clearError: jest.fn(),
  }),
}));

describe('SignupForm', () => {
  it('renders signup fields and Google option', () => {
    render(<SignupForm />);
    expect(screen.getByTestId('signup-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
    expect(screen.getByTestId('google-signup-button')).toBeInTheDocument();
  });
});
