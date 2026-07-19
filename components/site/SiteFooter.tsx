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
  { href: '/import-guide', label: 'Import guide' },
  { href: `mailto:${SUPPORT_EMAIL}`, label: 'Contact' },
] as const;

export function SiteFooter() {
  return (
    <footer
      data-testid="site-footer"
      className="relative z-10 border-t-2 border-ink/25 bg-paper-deep/40"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 md:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm text-left">
            <BrandLockup size="sm" />
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Personal lead management for people who ship outreach — not slides
              about outreach.
            </p>
          </div>

          <nav
            aria-label="Legal and contact"
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-label text-xs font-semibold uppercase tracking-wide text-ink underline decoration-2 underline-offset-4 hover:text-marker"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-ink/15 pt-4 text-center text-xs text-ink-muted sm:text-left">
          <p>
            © 2026 {APP_NAME}. Operated by {OPERATOR_LEGAL_NAME}. All rights
            reserved.
          </p>
          <p className="mt-1" data-testid="footer-made-by">
            Made by &quot;Athan&quot;
          </p>
        </div>
      </div>
    </footer>
  );
}

export { SUPPORT_EMAIL };
