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
  title: 'Terms of Service | OutreachOS',
  description:
    'Terms governing use of the OutreachOS personal lead vault application.',
  alternates: {
    canonical: LEGAL_PATHS.terms,
  },
};

const EFFECTIVE = '18 July 2026';

export default function TermsOfServicePage() {
  return (
    <LegalDocument title="Terms of Service" effectiveDate={EFFECTIVE}>
      <LegalSection title="1. Agreement">
        <p>
          These Terms of Service (“Terms”) are a binding agreement between you
          and <strong>{OPERATOR_LEGAL_NAME}</strong> (“we”, “us”, “our”),
          operating <strong>{APP_NAME}</strong>, for use of the {APP_NAME}{' '}
          website and application at <a href={APP_ORIGIN}>{APP_ORIGIN}</a> (the
          “Service”).
        </p>
        <p>
          By creating an account, signing in (including with Google), using the
          demo, checking the signup consent box, or otherwise accessing the
          Service, you agree to these Terms, our{' '}
          <Link href={LEGAL_PATHS.privacy}>Privacy Policy</Link>, and our{' '}
          <Link href={LEGAL_PATHS.acceptableUse}>Acceptable Use Policy</Link>.
          If you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. The Service">
        <p>
          {APP_NAME} provides personal lead vault features such as account
          authentication, spreadsheet import, filtering, status tracking,
          export, and optional agent API intake. Features, quotas, and
          availability may change as we improve the product.
        </p>
        <p>
          Free-tier limits (subject to change) currently include storage and
          import caps described in the product UI. Demo accounts use curated
          sample data and additional restrictions.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility &amp; accounts">
        <ul>
          <li>You must be at least 16 years old (or older if required locally).</li>
          <li>
            You must provide accurate registration information and keep your
            credentials secure.
          </li>
          <li>
            You are responsible for activity under your account. Notify us
            promptly of unauthorized access.
          </li>
          <li>
            One person/organization should not create accounts solely to evade
            quotas, bans, or security controls.
          </li>
          <li>
            Account creation requires affirmative acceptance of these Terms, the
            Privacy Policy, and the Acceptable Use Policy.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>
          You must follow our{' '}
          <Link href={LEGAL_PATHS.acceptableUse}>Acceptable Use Policy</Link>,
          which forms part of these Terms. We may suspend or terminate accounts
          that violate these Terms, the Acceptable Use Policy, or create
          security/legal risk.
        </p>
      </LegalSection>

      <LegalSection title="5. Your content">
        <p>
          You retain ownership of leads and other content you upload (“Your
          Content”). You grant us a limited license to host, process, back up,
          and display Your Content solely to operate and improve the Service for
          you.
        </p>
        <p>
          You represent that you have all rights and lawful bases needed to
          upload and process Your Content through {APP_NAME}.
        </p>
      </LegalSection>

      <LegalSection title="6. Our intellectual property">
        <p>
          The Service, branding (including the {APP_NAME} name and logos),
          software, and design are owned by {OPERATOR_LEGAL_NAME} or our
          licensors. These Terms do not transfer ownership to you. You may not
          copy or redistribute our software except as needed for normal use of
          the hosted Service.
        </p>
      </LegalSection>

      <LegalSection title="7. Third-party services">
        <p>
          The Service relies on third parties such as Supabase (auth/database),
          Vercel (hosting), and optionally Google (sign-in). Their terms and
          availability may affect the Service. We are not responsible for
          outages or policy changes of those providers beyond our reasonable
          control.
        </p>
      </LegalSection>

      <LegalSection title="8. Free service; no warranties">
        <p>
          The Service is provided <strong>“AS IS”</strong> and{' '}
          <strong>“AS AVAILABLE.”</strong> To the fullest extent permitted by
          law, we disclaim warranties of merchantability, fitness for a
          particular purpose, uninterrupted availability, and non-infringement.
        </p>
        <p>
          We do not warrant that imports will be error-free, that outreach using
          exported lists will succeed, or that the Service will meet every
          business requirement.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        <p>
          To the fullest extent permitted by law, we are not liable for indirect,
          incidental, special, consequential, or punitive damages, or for lost
          profits, lost data, or business interruption, arising from your use of
          the Service.
        </p>
        <p>
          Our total aggregate liability for claims relating to the Service is
          limited to the greater of (a) the amounts you paid us for the Service
          in the 12 months before the claim, or (b) USD $50 if you use only the
          free tier.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those places,
          our liability is limited to the maximum extent allowed.
        </p>
      </LegalSection>

      <LegalSection title="10. Indemnity">
        <p>
          You will defend and indemnify {OPERATOR_LEGAL_NAME} against claims,
          damages, and expenses (including reasonable legal fees) arising from
          Your Content, your outreach practices, or your violation of these
          Terms, the Acceptable Use Policy, or applicable law.
        </p>
      </LegalSection>

      <LegalSection title="11. Termination">
        <p>
          You may stop using the Service at any time and may request account
          deletion by contacting{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <p>
          We may suspend or terminate access immediately for breach, risk, or
          extended inactivity, or if we discontinue the Service. Upon
          termination, your right to use the Service ends. Provisions that by
          nature should survive (ownership, disclaimers, liability limits,
          indemnity) will survive.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to the Service or Terms">
        <p>
          We may modify features or these Terms. Material Terms changes will
          update the effective date and may be noticed in-app or by email. If
          you continue using the Service after changes take effect, you accept
          the updated Terms. If you disagree, stop using the Service and request
          deletion.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing law">
        <p>
          These Terms are governed by the laws of <strong>India</strong>,
          without regard to conflict-of-law rules. Courts in India will have
          exclusive jurisdiction, except where mandatory consumer protections in
          your country require otherwise.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          Legal / support:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p>
          Operator: {OPERATOR_LEGAL_NAME}. Privacy details:{' '}
          <Link href={LEGAL_PATHS.privacy}>Privacy Policy</Link>
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
