/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  COOKIE_CONSENT_KEY,
  CookieConsentBanner,
} from '@/components/site/CookieConsentBanner';

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows when no prior consent is stored', async () => {
    render(<CookieConsentBanner />);
    expect(
      await screen.findByTestId('cookie-consent-banner')
    ).toBeInTheDocument();
  });

  it('hides after accept and stores consent', async () => {
    const user = userEvent.setup();
    render(<CookieConsentBanner />);
    await screen.findByTestId('cookie-consent-banner');
    await user.click(screen.getByTestId('cookie-consent-accept'));
    await waitFor(() => {
      expect(
        screen.queryByTestId('cookie-consent-banner')
      ).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toContain(
      'accepted'
    );
  });

  it('does not show when consent already exists', () => {
    window.localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ value: 'accepted', at: '2026-07-18T00:00:00.000Z' })
    );
    render(<CookieConsentBanner />);
    expect(
      screen.queryByTestId('cookie-consent-banner')
    ).not.toBeInTheDocument();
  });
});
