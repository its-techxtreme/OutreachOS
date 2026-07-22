import Link from 'next/link';

import { BrandLockup } from '@/components/brand/BrandLockup';
import {
  APP_NAME,
  LEGAL_PATHS,
  OPERATOR_LEGAL_NAME,
  SUPPORT_EMAIL,
} from '@/lib/brand';

const FOOTER_LINKS = [
  { href: LEGAL_PATHS.privacy, label: 'Privacy' },
  { href: LEGAL_PATHS.terms, label: 'Terms' },
  { href: LEGAL_PATHS.acceptableUse, label: 'Acceptable Use' },
  { href: LEGAL_PATHS.cookies, label: 'Cookies' },
  { href: LEGAL_PATHS.accessibility, label: 'Accessibility' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/import-guide', label: 'Import guide' },
  { href: `mailto:${SUPPORT_EMAIL}`, label: 'Contact' },
] as const;

export function SiteFooter() {
  return (
    <footer
      data-testid="site-footer"
      className="relative z-10 border-t-2 border-ink/25 bg-paper-deep/40 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="safe-px mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10 md:px-10 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="max-w-md shrink-0 text-left">
            <BrandLockup size="sm" href="/" />
            <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-[0.95rem]">
              Personal lead management for people who ship outreach — not slides
              about outreach.
            </p>
          </div>

          <nav
            aria-label="Site policies and contact"
            className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 sm:gap-x-6 md:flex md:flex-wrap md:content-start md:justify-end md:gap-x-5 md:gap-y-1 lg:max-w-xl"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="touch-target inline-flex items-center font-label text-[11px] font-semibold uppercase tracking-wide text-ink underline decoration-2 underline-offset-4 hover:text-marker sm:text-xs"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-ink/15 pt-4 text-left text-xs leading-relaxed text-ink-muted sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <p className="max-w-xl">
            © 2026 {APP_NAME}. Operated by {OPERATOR_LEGAL_NAME}. All rights
            reserved.
          </p>
          <p
            className="font-medium text-ink/80 sm:shrink-0 sm:text-right"
            data-testid="footer-made-by"
          >
            A Personal Project Made by Athan
          </p>
        </div>
      </div>
    </footer>
  );
}

export { SUPPORT_EMAIL };
