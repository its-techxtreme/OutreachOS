import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { DoodleDecor } from '@/components/landing/DoodleDecor';
import { SiteFooter } from '@/components/site/SiteFooter';
import { APP_NAME, SUPPORT_EMAIL } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Account disabled | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AccountDisabledPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reason =
    typeof params.reason === 'string' && params.reason.trim().length > 0
      ? params.reason.trim().slice(0, 500)
      : null;

  return (
    <div className="paper-texture flex min-h-screen flex-col text-ink">
      <div className="auth-stage relative flex flex-1 items-center justify-center px-3 py-10 sm:px-4">
        <DoodleDecor />
        <div
          data-testid="account-disabled-notice"
          className="glass-panel relative z-10 w-full max-w-lg p-6 sm:p-8"
        >
          <div className="mb-5 flex justify-center">
            <BrandLockup size="md" href="/" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Account disabled
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
            This OutreachOS account has been disabled by an administrator. You
            cannot sign in or use the vault while it stays disabled.
          </p>

          {reason ? (
            <div className="mt-5 rounded-lg border-2 border-ink/20 bg-paper-deep/40 px-4 py-3">
              <p className="font-label text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Reason
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{reason}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              No reason was attached to this disable action.
            </p>
          )}

          <p className="mt-5 text-sm leading-relaxed text-ink-muted">
            If you believe this was a mistake, appeal by emailing{' '}
            <a
              className="font-semibold text-ink underline decoration-2 underline-offset-2"
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} account disable appeal`)}`}
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <p className="mt-6 text-center text-sm">
            <Link
              href="/auth/login"
              className="font-label text-xs font-semibold uppercase tracking-wide underline decoration-2 underline-offset-4"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
