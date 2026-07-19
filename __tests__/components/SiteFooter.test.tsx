import { render, screen } from '@testing-library/react';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { SiteFooter } from '@/components/site/SiteFooter';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} src={props.src} />
  ),
}));

describe('BrandLockup', () => {
  it('renders OutreachOS wordmark link', () => {
    render(<BrandLockup />);
    expect(screen.getByTestId('brand-lockup')).toBeInTheDocument();
    expect(screen.getByLabelText('OutreachOS')).toBeInTheDocument();
  });
});

describe('SiteFooter', () => {
  it('links privacy, terms, and contact', () => {
    render(<SiteFooter />);
    expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^privacy$/i })).toHaveAttribute(
      'href',
      '/privacy'
    );
    expect(screen.getByRole('link', { name: /^terms$/i })).toHaveAttribute(
      'href',
      '/terms'
    );
    expect(
      screen.getByRole('link', { name: /acceptable use/i })
    ).toHaveAttribute('href', '/acceptable-use');
    expect(screen.getByRole('link', { name: /^cookies$/i })).toHaveAttribute(
      'href',
      '/cookies'
    );
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:')
    );
    expect(screen.getByRole('link', { name: /import guide/i })).toHaveAttribute(
      'href',
      '/import-guide'
    );
    expect(screen.getByText(/Techxtreme Digital Studio/i)).toBeInTheDocument();
    expect(screen.getByTestId('footer-made-by')).toHaveTextContent(
      /Made by "Athan"/
    );
  });
});
