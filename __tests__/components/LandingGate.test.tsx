import { render, screen } from '@testing-library/react';

import { LandingGate } from '@/components/landing/LandingGate';

jest.mock('framer-motion', () => {
  const React = require('react');
  const Strip = ({ children, ...props }: { children?: React.ReactNode }) => {
    const {
      initial: _i,
      animate: _a,
      transition: _t,
      ...rest
    } = props as Record<string, unknown>;
    return React.createElement('div', rest, children);
  };
  return {
    motion: { div: Strip },
    useReducedMotion: () => true,
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
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

describe('LandingGate', () => {
  it('renders brand, tagline, and dashboard CTA', () => {
    render(<LandingGate />);

    expect(screen.getByTestId('landing-gate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Outreach\s*OS/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Command your prospecting pipeline with precision/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open Dashboard/i })
    ).toHaveAttribute('href', '/dashboard');
  });
});
