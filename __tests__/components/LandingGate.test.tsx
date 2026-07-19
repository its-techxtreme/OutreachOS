import { render, screen } from '@testing-library/react';

import { LandingGate } from '@/components/landing/LandingGate';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: {
    alt?: string;
    src: string;
    'data-testid'?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={props.alt ?? ''}
      src={props.src}
      data-testid={props['data-testid']}
    />
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
    expect(screen.getByTestId('hero-logo')).toBeInTheDocument();
    expect(screen.getByTestId('demo-signin-button')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start free/i })).toBeInTheDocument();
  });

  it('shows footer legal links', () => {
    render(<LandingGate />);
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^privacy$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^terms$/i })).toBeInTheDocument();
  });
});
