'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Button } from '@/components/ui/button';
import { buildPremiumRequestMailto } from '@/lib/billing/premium-request';
import { PREMIUM_REQUEST_EMAIL } from '@/lib/brand';
import { useAuth } from '@/lib/hooks/useAuth';
import { playSound } from '@/lib/sound';
import { cn } from '@/lib/utils';

type Currency = 'INR' | 'USD';

export function PricingClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>('INR');
  const [message, setMessage] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free' | 'premium' | 'admin'>('free');

  useEffect(() => {
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
    if (locale.toLowerCase().includes('in') || locale.toLowerCase().startsWith('hi')) {
      setCurrency('INR');
    } else {
      setCurrency('USD');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch('/api/billing/status');
      if (!res.ok) return;
      const data = (await res.json()) as {
        plan?: 'free' | 'premium' | 'admin';
      };
      if (data.plan) setPlan(data.plan);
    })();
  }, [user]);

  const requestPremium = useCallback(() => {
    setMessage(null);
    if (loading) return;
    if (!user) {
      router.push('/auth/login?next=/pricing');
      return;
    }

    const username =
      typeof user.user_metadata?.username === 'string'
        ? user.user_metadata.username.trim()
        : '';

    if (!username) {
      setMessage('Pick a username first so we can match your Premium request.');
      router.push('/auth/username?next=/pricing');
      return;
    }

    if (!user.email) {
      setMessage('Your account needs an email before requesting Premium.');
      return;
    }

    const href = buildPremiumRequestMailto({
      currency,
      userEmail: user.email,
      userId: user.id,
      username,
    });

    playSound('tap');
    window.location.href = href;
    setMessage(
      `Opening your email app with @${username} included. If nothing opens, write to ${PREMIUM_REQUEST_EMAIL}.`
    );
  }, [currency, loading, router, user]);

  return (
    <div className="paper-texture min-h-screen min-h-[100dvh]">
      <main className="safe-px mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 md:py-12">
        <header className="doodle-border bg-paper px-4 py-5 sm:px-5 sm:py-6">
          <BrandLockup size="md" href="/" />
          <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
            Simple pricing
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-muted sm:text-base">
            Free for getting started. Premium when your vault outgrows the free
            pool — same sketchbook soul, more room to dial.
          </p>
        </header>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="font-label text-xs uppercase tracking-wide text-ink-muted">
            Preferred currency
          </span>
          <div className="flex flex-wrap gap-2">
            {(['INR', 'USD'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                className={cn(
                  'touch-target rounded border-2 border-ink px-3 py-2 text-sm font-semibold',
                  currency === code
                    ? 'bg-highlighter text-ink'
                    : 'bg-paper text-ink/70'
                )}
              >
                {code === 'INR' ? '₹1499 / mo' : '$15 / mo'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="doodle-border flex flex-col bg-paper p-4 sm:p-5">
            <h2 className="font-display text-2xl font-bold">Free</h2>
            <p className="mt-1 text-3xl font-semibold">$0</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              <li>Up to 500 leads</li>
              <li>10 Excel imports / day</li>
              <li>200 rows per file</li>
              <li>Vector vault + call scripts</li>
            </ul>
            <Button asChild className="doodle-btn mt-auto w-full pt-6" variant="outline">
              <Link href={user ? '/dashboard' : '/auth/signup'}>
                {user ? 'Open vault' : 'Create account'}
              </Link>
            </Button>
          </section>

          <section className="doodle-border flex flex-col border-ink bg-highlighter/40 p-4 sm:p-5">
            <p className="font-label text-[10px] font-semibold uppercase tracking-[0.16em]">
              Premium
            </p>
            <h2 className="font-display text-2xl font-bold">Grow the vault</h2>
            <p className="mt-1 text-3xl font-semibold">
              {currency === 'INR' ? '₹1499' : '$15'}
              <span className="text-base font-normal text-ink-muted"> / month</span>
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink">
              <li>Unlimited stored leads</li>
              <li>30 Excel imports / hour</li>
              <li>Up to 3000 rows / hour</li>
              <li>Everything in Free</li>
            </ul>
            {plan === 'admin' ? (
              <p className="mt-auto pt-6 text-sm font-medium">
                Your admin account already has full access.
              </p>
            ) : plan === 'premium' ? (
              <p className="mt-auto pt-6 text-sm font-semibold">You are on Premium.</p>
            ) : (
              <Button
                type="button"
                onClick={() => requestPremium()}
                className="doodle-btn mt-auto w-full border-ink bg-coral pt-0 text-ink"
              >
                Request Premium · email us
              </Button>
            )}
          </section>
        </div>

        {message && (
          <p role="status" className="text-sm text-ink-muted">
            {message}
          </p>
        )}

        <p className="text-sm leading-relaxed text-ink-muted">
          Tap <strong>Request Premium</strong> while signed in — your mail app
          opens a message to{' '}
          <a className="break-all underline" href={`mailto:${PREMIUM_REQUEST_EMAIL}`}>
            {PREMIUM_REQUEST_EMAIL}
          </a>{' '}
          with your <strong>username</strong> filled in. We reply with UPI /
          transfer instructions. See{' '}
          <Link href="/terms" className="underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
