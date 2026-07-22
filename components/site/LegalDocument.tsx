import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { SiteFooter } from '@/components/site/SiteFooter';

type LegalDocumentProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
  /** Eyebrow above the title — defaults to Legal */
  eyebrow?: string;
};

export function LegalDocument({
  title,
  effectiveDate,
  children,
  eyebrow = 'Legal',
}: LegalDocumentProps) {
  return (
    <div
      data-testid="legal-document"
      className="paper-texture flex min-h-screen flex-col text-ink"
    >
      <header className="safe-px relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6 md:px-10">
        <BrandLockup size="md" />
        <Link
          href="/"
          className="shrink-0 font-label text-xs font-semibold uppercase tracking-wide text-ink-muted underline decoration-2 underline-offset-4 hover:text-ink sm:text-sm"
        >
          <span className="sm:hidden">Home</span>
          <span className="hidden sm:inline">Back to home</span>
        </Link>
      </header>

      <main className="safe-px relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 pb-12 sm:px-6 sm:pb-16 md:px-10">
        <p className="font-label text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl md:text-6xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Effective date: <time dateTime={effectiveDate}>{effectiveDate}</time>
        </p>
        <hr className="wobbly-divider my-6 sm:my-8" />
        <div className="legal-prose space-y-8 text-base leading-relaxed text-ink md:text-lg">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-ink-muted [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:decoration-marker [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
