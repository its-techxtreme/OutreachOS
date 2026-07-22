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
  title: 'Acceptable Use Policy | OutreachOS',
  description:
    'Rules for lawful and responsible use of the OutreachOS lead vault.',
  alternates: {
    canonical: LEGAL_PATHS.acceptableUse,
  },
};

const EFFECTIVE = '18 July 2026';

export default function AcceptableUsePage() {
  return (
    <LegalDocument title="Acceptable Use Policy" effectiveDate={EFFECTIVE}>
      <LegalSection title="1. Purpose">
        <p>
          This Acceptable Use Policy (“AUP”) is part of the{' '}
          <Link href={LEGAL_PATHS.terms}>Terms of Service</Link> between you and{' '}
          <strong>{OPERATOR_LEGAL_NAME}</strong> for {APP_NAME}. It sets rules
          for how you may use the Service so other users, third parties, and our
          infrastructure stay protected.
        </p>
      </LegalSection>

      <LegalSection title="2. Lawful outreach only">
        <p>You may use {APP_NAME} only for lawful business outreach. You must:</p>
        <ul>
          <li>
            Have a lawful basis to collect, store, and contact every lead you
            import or submit (including consent, legitimate interest, or other
            bases recognized where you operate).
          </li>
          <li>
            Comply with telemarketing, Do-Not-Call, anti-spam, privacy, and
            consumer-protection laws in every country or region you message or
            call.
          </li>
          <li>
            Honor opt-outs and suppression requests promptly for contacts you
            manage outside {APP_NAME} as required by law.
          </li>
          <li>
            Not use the Service for harassment, threats, scams, phishing,
            impersonation, or deceptive marketing.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Prohibited content and data">
        <p>You must not upload or process:</p>
        <ul>
          <li>
            Data obtained through hacking, scraping in violation of site terms,
            purchase of illegally sourced lists, or other unlawful means.
          </li>
          <li>
            Special-category sensitive data you are not authorized to handle
            (for example health, biometric, or children’s data).
          </li>
          <li>
            Malware, credential dumps, or content that infringes intellectual
            property or privacy rights of others.
          </li>
          <li>
            Content that promotes violence, exploitation, or illegal goods and
            services.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Prohibited technical abuse">
        <ul>
          <li>
            Attempting to access another user’s vault or circumvent access
            controls, quotas, or rate limits.
          </li>
          <li>
            Probing, scanning, or attacking the Service, or interfering with
            servers, networks, or security monitoring.
          </li>
          <li>
            Creating multiple accounts to evade bans, quotas, or enforcement.
          </li>
          <li>
            Reverse engineering the Service except to the limited extent
            permitted by mandatory law.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Automation">
        <p>
          Bulk imports and scripts are fine when they stay within your account
          quotas and this policy. Do not share secrets, scrape in ways that
          violate third-party terms, or hammer the Service to degrade it for
          others.
        </p>
      </LegalSection>

      <LegalSection title="6. Enforcement">
        <p>
          We may investigate suspected violations, remove content, throttle
          access, suspend or terminate accounts, and report unlawful activity to
          authorities when appropriate. We may also refuse service where use
          creates legal or security risk to {OPERATOR_LEGAL_NAME} or others.
        </p>
      </LegalSection>

      <LegalSection title="7. Reporting">
        <p>
          Report abuse or AUP concerns to{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <p>
          Related documents:{' '}
          <Link href={LEGAL_PATHS.terms}>Terms of Service</Link> ·{' '}
          <Link href={LEGAL_PATHS.privacy}>Privacy Policy</Link>
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
