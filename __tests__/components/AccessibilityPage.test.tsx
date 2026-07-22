import { render, screen } from '@testing-library/react';

import AccessibilityPage from '@/app/accessibility/page';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} src={props.src} />
  ),
}));

describe('Accessibility page', () => {
  it('renders the accessibility notice with contact path', () => {
    render(<AccessibilityPage />);
    expect(
      screen.getByRole('heading', { name: /accessibility notice/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/wcag 2\.2 level aa/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /techxtremebuisness@gmail\.com/i })
    ).toHaveAttribute('href', expect.stringContaining('mailto:'));
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/privacy'
    );
  });
});
