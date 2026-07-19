'use client';

import Link from 'next/link';

import { LEGAL_PATHS } from '@/lib/brand';

type LegalConsentCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
};

export function LegalConsentCheckbox({
  checked,
  onChange,
  id = 'legal-consent',
}: LegalConsentCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 text-left text-sm leading-relaxed text-ink-muted"
      data-testid="legal-consent-label"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-marker"
        data-testid="legal-consent-checkbox"
        required
      />
      <span>
        I agree to the{' '}
        <Link
          href={LEGAL_PATHS.terms}
          className="font-semibold text-ink underline decoration-marker underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </Link>
        ,{' '}
        <Link
          href={LEGAL_PATHS.privacy}
          className="font-semibold text-ink underline decoration-marker underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </Link>
        , and{' '}
        <Link
          href={LEGAL_PATHS.acceptableUse}
          className="font-semibold text-ink underline decoration-marker underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Acceptable Use Policy
        </Link>
        . I confirm I will only upload and contact leads I am lawfully allowed
        to process.
      </span>
    </label>
  );
}
