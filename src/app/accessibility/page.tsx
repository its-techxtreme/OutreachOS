import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument, LegalSection } from '@/components/site/LegalDocument';
import {
  APP_NAME,
  APP_ORIGIN,
  LEGAL_PATHS,
  OPERATOR_LEGAL_NAME,
  SUPPORT_EMAIL,
} from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Accessibility | OutreachOS',
  description:
    'Accessibility statement for OutreachOS — what we aim for, what works today, known limits, and how to report barriers.',
  alternates: {
    canonical: LEGAL_PATHS.accessibility,
  },
};

const EFFECTIVE = '23 July 2026';

export default function AccessibilityPage() {
  return (
    <LegalDocument
      title="Accessibility Notice"
      effectiveDate={EFFECTIVE}
      eyebrow="Accessibility"
    >
      <LegalSection title="1. Our commitment">
        <p>
          <strong>{OPERATOR_LEGAL_NAME}</strong> wants{' '}
          <strong>{APP_NAME}</strong> at{' '}
          <a href={APP_ORIGIN}>{APP_ORIGIN}</a> to be usable by as many people
          as possible — including people who use keyboards, screen readers,
          zoom, or motion preferences.
        </p>
        <p>
          We aim to follow the spirit of{' '}
          <strong>WCAG 2.2 Level AA</strong> for public pages and core product
          flows. This page is an honest status notice, not a formal third-party
          conformance audit or certification.
        </p>
      </LegalSection>

      <LegalSection title="2. What we try to get right">
        <ul>
          <li>
            <strong>Structure</strong> — headings, landmarks, and labeled
            controls on main screens (dashboard filters, tables, auth forms,
            legal pages).
          </li>
          <li>
            <strong>Keyboard</strong> — interactive controls are meant to be
            reachable and operable without a mouse; focus styles use visible
            rings on buttons and inputs.
          </li>
          <li>
            <strong>Names &amp; roles</strong> — meaningful{' '}
            <code className="rounded bg-paper-deep/50 px-1 text-sm">aria-label</code>{' '}
            / visible labels on search, filters, pagination, import/export, and
            similar chrome.
          </li>
          <li>
            <strong>Motion</strong> — animations and UI sound respect{' '}
            <code className="rounded bg-paper-deep/50 px-1 text-sm">
              prefers-reduced-motion
            </code>{' '}
            where we control them.
          </li>
          <li>
            <strong>Text alternatives</strong> — brand and key UI imagery carry
            alt text or accessible names; decorative chrome is kept out of the
            way where practical.
          </li>
          <li>
            <strong>Forms</strong> — signup, login, username, and settings
            flows use labeled fields and error messaging tied to the relevant
            inputs.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Known limits (be honest)">
        <p>
          {APP_NAME} uses a sketchbook-style UI (paper texture, doodle borders,
          sticky notes). That look can create trade-offs:
        </p>
        <ul>
          <li>
            Some decorative borders and marker colors may sit close to the edge
            of comfortable contrast, especially on busy backgrounds.
          </li>
          <li>
            Dense data views (lead tables, vector vault graph) are harder for
            screen-reader and small-viewport use than simple forms. We keep
            adding labels and structure, but they are not as simple as a plain
            document.
          </li>
          <li>
            Dragging sticky call-script pads is mouse/pointer oriented;
            editing/saving scripts remains available without dragging.
          </li>
          <li>
            Demo tutorial overlays highlight regions of the UI; if a step feels
            stuck, you can skip the tour.
          </li>
          <li>
            Third-party pieces (Supabase Auth / Google sign-in, hosting on
            Vercel) follow their own accessibility practices outside our full
            control.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Compatibility">
        <p>
          We build and test primarily in current evergreen browsers (Chrome,
          Firefox, Safari, Edge) on desktop and common mobile viewports. We use
          automated checks (including jest-axe in our test suite) on key
          components; that does not replace manual assistive-tech testing.
        </p>
        <p>
          If you rely on a specific browser + screen reader combination and hit
          a wall, tell us — that report helps more than a generic “make it
          accessible” request.
        </p>
      </LegalSection>

      <LegalSection title="5. How to report a barrier">
        <p>
          Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} accessibility`)}`}>
            {SUPPORT_EMAIL}
          </a>{' '}
          with:
        </p>
        <ul>
          <li>The page or flow (URL if you have it)</li>
          <li>What you were trying to do</li>
          <li>What went wrong</li>
          <li>Device, browser, and assistive tech (if any)</li>
        </ul>
        <p>
          We read these and prioritize fixes that block sign-in, import, or
          core vault use. We may not fix every visual preference immediately,
          but we will not ignore a real barrier silently.
        </p>
      </LegalSection>

      <LegalSection title="6. Related policies">
        <p>
          <Link href={LEGAL_PATHS.privacy}>Privacy Policy</Link> ·{' '}
          <Link href={LEGAL_PATHS.terms}>Terms of Service</Link> ·{' '}
          <Link href={LEGAL_PATHS.cookies}>Cookie Policy</Link> ·{' '}
          <Link href={LEGAL_PATHS.acceptableUse}>Acceptable Use</Link>
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
