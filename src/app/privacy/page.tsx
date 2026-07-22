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
  title: 'Privacy Policy | OutreachOS',
  description:
    'How OutreachOS collects, uses, stores, and shares personal data for the personal lead vault service.',
  alternates: {
    canonical: LEGAL_PATHS.privacy,
  },
};

const EFFECTIVE = '18 July 2026';

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Privacy Policy" effectiveDate={EFFECTIVE}>
      <LegalSection title="1. Who we are">
        <p>
          This Privacy Policy explains how <strong>{APP_NAME}</strong> (“we”,
          “us”, “our”), operated by <strong>{OPERATOR_LEGAL_NAME}</strong>,
          handles personal data when you use our website and application at{' '}
          <a href={APP_ORIGIN}>{APP_ORIGIN}</a> (the “Service”).
        </p>
        <p>
          Privacy contact:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p>
          This Privacy Policy applies to personal data processed in connection
          with the Service and is intended to meet applicable requirements under
          India’s Digital Personal Data Protection Act, 2023, and, where
          relevant, comparable principles under the EU/UK GDPR for users in those
          regions.
        </p>
      </LegalSection>

      <LegalSection title="2. What OutreachOS does">
        <p>
          {APP_NAME} is a personal lead-management tool. You can create an
          account, import business contact leads (for example from spreadsheets),
          organize and filter them, and export lists. Each regular user’s leads
          are kept in their own vault and are not shared with other customers.
        </p>
      </LegalSection>

      <LegalSection title="3. Data we collect">
        <p>
          <strong>Account data.</strong> Email address; display name / username;
          authentication identifiers; password hashes (if you use email
          sign-in — we do not store plaintext passwords); Google account
          identifiers if you choose Google sign-in; role metadata needed for
          access control (for example admin, demo, or standard user); and records
          of your acceptance of our Terms, Privacy Policy, and Acceptable Use
          Policy at signup.
        </p>
        <p>
          <strong>Lead / vault content you upload or create.</strong> Business
          names, niches, countries/regions, phone numbers, addresses, maps URLs,
          outreach status, and any other fields you import or enter. This may
          include personal data about third parties (for example a business
          owner’s phone number). You are responsible for having a lawful basis to
          process that information.
        </p>
        <p>
          <strong>Usage and technical data.</strong> Approximate device/browser
          information, IP address, timestamps, security logs, and error or
          performance diagnostics needed to operate and protect the Service.
        </p>
        <p>
          <strong>Communications.</strong> Messages you send us (for example
          support emails).
        </p>
        <p>We do not intentionally collect special-category sensitive data.</p>
      </LegalSection>

      <LegalSection title="4. How we collect data">
        <ul>
          <li>Directly from you (signup, profile, imports, in-app actions).</li>
          <li>
            From identity providers you choose (Google OAuth provides basic
            profile/email with your consent).
          </li>
          <li>
            Automatically through the Service (session cookies, security and
            infrastructure logs).
          </li>
          <li>
            From Excel / CSV imports and data you enter in the app.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Why we process data (purposes &amp; bases)">
        <ul>
          <li>
            <strong>Provide the Service</strong> — create accounts, store your
            vault, run imports/exports, enforce quotas (contract / legitimate
            interest).
          </li>
          <li>
            <strong>Security &amp; abuse prevention</strong> — authentication,
            rate limits, fraud and misuse detection (legitimate interest / legal
            obligation where applicable).
          </li>
          <li>
            <strong>Support &amp; service messages</strong> — respond to
            requests and send essential account notices such as email
            verification or password reset (contract / consent where required).
          </li>
          <li>
            <strong>Improve reliability</strong> — diagnose outages and bugs
            using limited technical logs (legitimate interest).
          </li>
          <li>
            <strong>Legal compliance</strong> — maintain records of terms
            acceptance and respond to lawful requests.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell your personal data. We do not use your
          lead vault to build advertising audiences or train public AI models.
        </p>
      </LegalSection>

      <LegalSection title="6. Processors and sharing">
        <p>
          We use service providers (“processors”) to host and operate {APP_NAME}.
          They process data only on our instructions:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — authentication, database, and related
            backend infrastructure.
          </li>
          <li>
            <strong>Vercel</strong> — application hosting and edge delivery.
          </li>
          <li>
            <strong>Google</strong> — only if you use Google sign-in (identity
            provider).
          </li>
        </ul>
        <p>
          We may disclose information if required by law, to protect rights and
          safety, or in connection with a merger/acquisition of the Service,
          subject to appropriate safeguards.
        </p>
        <p>
          Other {APP_NAME} customers cannot access your vault. Demo accounts use
          curated sample data and remain limited.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies and similar tech">
        <p>
          We use cookies and local storage that are necessary for authentication
          sessions and security. Details are in our{' '}
          <Link href={LEGAL_PATHS.cookies}>Cookie Policy</Link>. We do not run
          third-party advertising trackers on the Service.
        </p>
      </LegalSection>

      <LegalSection title="8. International transfers">
        <p>
          Infrastructure may process data in regions where our providers operate
          (including regions outside your country). Where required, we rely on
          appropriate contractual and technical safeguards offered by those
          providers.
        </p>
      </LegalSection>

      <LegalSection title="9. Retention">
        <ul>
          <li>
            Account and vault data are kept while your account remains active.
          </li>
          <li>
            If you request deletion, we delete or anonymize personal account data
            and associated vault content within a reasonable period, except where
            we must retain limited records for security, dispute, or legal
            compliance (including terms-acceptance records where required).
          </li>
          <li>
            Security and operational logs are retained only as long as needed for
            those purposes.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Security">
        <p>
          We use industry-standard protections appropriate to a hosted SaaS app
          (encrypted transport/TLS, access-controlled databases, role-based
          access, hashed passwords for email accounts). No method of transmission
          or storage is 100% secure; please use a strong unique password and
          protect your devices.
        </p>
      </LegalSection>

      <LegalSection title="11. Your rights">
        <p>Depending on where you live, you may have rights to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Export your leads (CSV export in-product where available)</li>
          <li>Delete your account and associated vault data</li>
          <li>Object to or restrict certain processing</li>
          <li>Withdraw consent where processing is consent-based</li>
        </ul>
        <p>
          To exercise these rights, email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the
          address on your account. We may need to verify identity before acting.
        </p>
      </LegalSection>

      <LegalSection title="12. Children">
        <p>
          The Service is not directed to children under 16 (or the higher age
          required in your region). We do not knowingly collect children’s data.
          If you believe a child registered, contact us and we will delete the
          account.
        </p>
      </LegalSection>

      <LegalSection title="13. Your responsibilities for third-party leads">
        <p>
          When you import or store contact details about businesses or people,
          you are the controller of that data. You must only upload information
          you are allowed to process (for example lawful outreach lists) and
          comply with applicable telemarketing, spam, and privacy laws in the
          countries you contact. See also our{' '}
          <Link href={LEGAL_PATHS.acceptableUse}>Acceptable Use Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes">
        <p>
          We may update this Privacy Policy. We will change the effective date
          above and, for material changes, provide additional notice in the
          Service or by email when appropriate. Continued use after the update
          means you acknowledge the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>
          Questions about privacy:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p>
          Operator: {OPERATOR_LEGAL_NAME}. Also see our{' '}
          <Link href={LEGAL_PATHS.terms}>Terms of Service</Link>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
