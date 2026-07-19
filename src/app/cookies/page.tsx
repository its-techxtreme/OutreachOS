import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument, LegalSection } from '@/components/site/LegalDocument';
import {
  APP_NAME,
  LEGAL_PATHS,
  OPERATOR_LEGAL_NAME,
  SUPPORT_EMAIL,
} from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Cookie Policy | OutreachOS',
  description:
    'How OutreachOS uses cookies and similar technologies for authentication and security.',
  alternates: {
    canonical: LEGAL_PATHS.cookies,
  },
};

const EFFECTIVE = '18 July 2026';

export default function CookiePolicyPage() {
  return (
    <LegalDocument title="Cookie Policy" effectiveDate={EFFECTIVE}>
      <LegalSection title="1. Overview">
        <p>
          This Cookie Policy explains how <strong>{OPERATOR_LEGAL_NAME}</strong>{' '}
          uses cookies and similar technologies (such as local storage) on{' '}
          {APP_NAME}. It should be read with our{' '}
          <Link href={LEGAL_PATHS.privacy}>Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="2. What we use">
        <p>
          We use <strong>essential</strong> cookies and storage only — the
          minimum needed to run authenticated sessions and protect the Service:
        </p>
        <ul>
          <li>
            <strong>Authentication / session</strong> — keep you signed in and
            restore your session securely (including tokens managed with our
            auth provider, Supabase).
          </li>
          <li>
            <strong>Security</strong> — support CSRF protections, abuse
            prevention, and related safeguards where applicable.
          </li>
          <li>
            <strong>Preferences needed for the product</strong> — for example
            remembering a UI view mode while you use the dashboard.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> use advertising cookies, social-media
          tracking pixels, or third-party analytics cookies on the Service.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookie notice">
        <p>
          On your first visit we show a cookie notice so you can review how we
          use cookies and acknowledge our Cookie Policy before continuing to
          browse. Strictly necessary authentication cookies may still be set so
          the Service can function (for example to keep a secure sign-in
          session). We do not set advertising or analytics cookies.
        </p>
        <p>
          If we later add optional cookies (such as analytics), we will update
          this policy and ask for separate consent before enabling them.
        </p>
      </LegalSection>

      <LegalSection title="4. Managing cookies">
        <p>
          You can delete or block cookies in your browser settings. If you block
          essential authentication cookies, sign-in and vault access may stop
          working.
        </p>
      </LegalSection>

      <LegalSection title="5. Changes &amp; contact">
        <p>
          We may update this Cookie Policy by changing the effective date above.
          Questions:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
