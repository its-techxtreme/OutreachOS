'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { LEGAL_PATHS } from '@/lib/brand';

export const COOKIE_CONSENT_KEY = 'outreachos_cookie_consent_v1';

type ConsentValue = 'accepted';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!existing) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (value: ConsentValue) => {
    try {
      window.localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({ value, at: new Date().toISOString() })
      );
    } catch {
      // private mode / blocked storage — still dismiss UI
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      data-testid="cookie-consent-banner"
      className="fixed inset-x-0 bottom-0 z-[80] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 md:p-6"
    >
      <div className="doodle-border mx-auto flex max-w-3xl flex-col gap-4 bg-paper px-4 py-4 shadow-[4px_4px_0_#1C1917] sm:px-5 md:flex-row md:items-end md:gap-6 md:px-6 md:py-5">
        <div className="min-w-0 flex-1 text-left">
          <p
            id="cookie-consent-title"
            className="font-display text-lg font-bold text-ink sm:text-xl md:text-2xl"
          >
            Cookies on OutreachOS
          </p>
          <p
            id="cookie-consent-desc"
            className="mt-2 text-sm leading-relaxed text-ink-muted md:text-base"
          >
            We use essential cookies and local storage to keep you signed in,
            protect your session, and run the vault. We do not use advertising
            trackers. See our{' '}
            <Link
              href={LEGAL_PATHS.cookies}
              className="font-semibold text-ink underline decoration-marker underline-offset-2"
            >
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link
              href={LEGAL_PATHS.privacy}
              className="font-semibold text-ink underline decoration-marker underline-offset-2"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            data-testid="cookie-consent-accept"
            onClick={() => save('accepted')}
            className="doodle-btn inline-flex h-11 w-full items-center justify-center rounded-md bg-coral px-5 font-label text-xs font-bold uppercase tracking-wider text-ink sm:w-auto"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
