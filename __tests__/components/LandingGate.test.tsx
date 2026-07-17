import { render, screen } from '@testing-library/react';

import { LandingGate } from '@/components/landing/LandingGate';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signInAsDemo: jest.fn(),
    isAuthenticated: false,
  }),
}));

describe('LandingGate', () => {
  it('shows brand, signup, and demo CTAs', () => {
    render(<LandingGate />);
    expect(screen.getByTestId('landing-gate')).toBeInTheDocument();
    expect(screen.getByTestId('demo-signin-button')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start free/i })).toBeInTheDocument();
  });
});
