'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { DoodleDecor } from '@/components/landing/DoodleDecor';
import { MascotCallout } from '@/components/mascots/MascotCallout';
import { SiteFooter } from '@/components/site/SiteFooter';
import { useAuth } from '@/lib/hooks/useAuth';

export function LandingGate() {
  const reduceMotion = useReducedMotion();
  const { signInAsDemo, isAuthenticated } = useAuth();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleDemo = async () => {
    setDemoError(null);
    setDemoLoading(true);
    try {
      if (isAuthenticated) {
        router.push('/dashboard');
        return;
      }
      await signInAsDemo();
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Demo sign-in failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div
      data-testid="landing-gate"
      className="paper-texture relative min-h-screen min-h-[100dvh] overflow-x-clip text-ink"
    >
      <DoodleDecor />

      <header className="safe-px relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6 md:px-10">
        <BrandLockup size="md" href="/" />
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <Link
            href="/pricing"
            className="hidden font-label text-sm font-semibold uppercase tracking-wide text-ink-muted underline decoration-2 underline-offset-4 hover:text-ink sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/auth/signup"
            className="hidden font-label text-sm font-semibold uppercase tracking-wide text-ink-muted underline decoration-2 underline-offset-4 hover:text-ink md:inline"
          >
            Get started
          </Link>
          <Link
            href="/auth/login"
            className="touch-target inline-flex items-center font-label text-sm font-semibold uppercase tracking-wide text-ink-muted underline decoration-2 underline-offset-4 hover:text-ink"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="safe-px relative z-10 mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-4 pb-10 text-center sm:min-h-[78vh] sm:px-6 sm:pb-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="mx-auto mb-5 flex justify-center sm:mb-6">
            <Image
              src="/brand/outreachos-logo-512.png"
              alt="OutreachOS logo — sketchbook with outreach compass"
              width={160}
              height={160}
              priority
              className="h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-40 md:w-40"
              data-testid="hero-logo"
            />
          </div>
          <p className="mb-3 font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted sm:mb-4 sm:text-xs sm:tracking-[0.2em]">
            cold outreach, without the spreadsheet headache
          </p>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-ink sm:text-6xl md:text-8xl">
            Outreach<span className="text-marker">OS</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-display text-2xl font-semibold leading-snug text-ink sm:mt-6 sm:text-3xl md:text-4xl">
            Your leads. Your vault.{' '}
            <span className="highlighter-wash px-1">Nobody else&apos;s mess.</span>
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:mt-5 sm:text-lg md:text-xl">
            Stop hunting contacts across tabs and half-finished sheets. Drop them
            in, filter what matters today, and keep every account private — like
            a notebook that actually stays organized.
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/auth/signup"
              className="doodle-btn inline-flex h-12 items-center justify-center rounded-md bg-coral px-8 font-label text-sm font-bold uppercase tracking-wider text-ink"
            >
              Start free
            </Link>
            <Link
              href="/auth/login"
              className="doodle-btn inline-flex h-12 items-center justify-center rounded-md bg-paper px-8 font-label text-sm font-bold uppercase tracking-wider text-ink"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={() => void handleDemo()}
              disabled={demoLoading}
              className="doodle-btn inline-flex h-12 items-center justify-center gap-2 rounded-md bg-highlighter px-8 font-label text-sm font-bold uppercase tracking-wider text-ink disabled:opacity-60"
              data-testid="demo-signin-button"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {demoLoading ? 'Opening demo…' : 'Peek the demo'}
            </button>
          </div>
          {demoError && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {demoError}
            </p>
          )}
          <p className="mt-5 px-2 text-sm text-ink-muted">
            No sales call. No credit card. Just your own empty vault in under a minute.
          </p>
        </motion.div>
      </main>

      <section className="safe-px relative z-10 mx-auto max-w-4xl px-4 pb-12 sm:px-6 sm:pb-16">
        <hr className="wobbly-divider mb-8 sm:mb-12" />
        <h2 className="font-display text-center text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
          Built for people who actually dial
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-ink-muted sm:text-base">
          Freelancers, tiny agencies, solo founders — anyone tired of “wait, did I
          already message this place?” at 11pm.
        </p>
        <ul className="mt-8 grid gap-8 sm:mt-12 sm:gap-10 md:grid-cols-3">
          {[
            {
              scribble: '01',
              title: 'Import once, breathe easy',
              body: 'Upload an Excel dump, we clean the noisy bits and skip the duplicates. You keep the good stuff.',
            },
            {
              scribble: '02',
              title: 'Find today’s list fast',
              body: 'Filter by niche, country, or status. Export the shortlist for the afternoon dial session — no rebuild every time.',
            },
            {
              scribble: '03',
              title: 'Private by default',
              body: 'Every signup gets a fresh vault. Your leads don’t mix with anyone else’s. Admin keeps theirs; you keep yours.',
            },
          ].map((item) => (
            <li key={item.scribble} className="relative text-left">
              <span className="font-display text-4xl font-bold text-marker/80 sm:text-5xl">
                {item.scribble}
              </span>
              <h3 className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="safe-px relative z-10 mx-auto max-w-4xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="doodle-border rotate-[-0.4deg] bg-highlighter/35 px-4 py-6 sm:px-6 sm:py-8 md:px-10">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl md:text-4xl">
            What you get on the free plan
          </h2>
          <p className="mt-3 max-w-xl text-sm text-ink-muted sm:text-base">
            Enough runway to run real outreach — not a toy that locks after five
            rows.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink sm:text-base">
            {[
              'Up to 500 leads in your personal vault',
              '10 Excel imports per day (200 rows each)',
              'Filters, export, and status tracking',
              'Email + password (verified) or Google sign-in',
              'One-click demo if you just want to poke around first',
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rotate-12 bg-coral"
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-muted">
            Need unlimited leads?{' '}
            <Link
              href="/pricing"
              className="font-semibold text-ink underline decoration-2 underline-offset-4"
            >
              See Premium pricing
            </Link>{' '}
            (₹1499 or $15 / month).
          </p>
        </div>
        <div className="mt-8 sm:mt-10">
          <MascotCallout mascot="citygirl" title="Start empty. That’s the point.">
            New accounts don’t inherit anyone else’s leads. Import your sheet, and
            Mira will stay out of the way while you fill the vault.
          </MascotCallout>
        </div>
      </section>

      <section className="safe-px relative z-10 mx-auto max-w-3xl px-4 pb-16 text-center sm:px-6 sm:pb-24">
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Ready when you are
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-ink-muted sm:text-base">
          Make an account, import a sheet, and stop treating Maps links like a
          scavenger hunt.
        </p>
        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/auth/signup"
            className="doodle-btn inline-flex h-12 items-center justify-center rounded-md bg-coral px-8 font-label text-sm font-bold uppercase tracking-wider text-ink"
          >
            Create your vault
          </Link>
          <button
            type="button"
            onClick={() => void handleDemo()}
            disabled={demoLoading}
            className="doodle-btn inline-flex h-12 items-center justify-center rounded-md bg-paper px-8 font-label text-sm font-bold uppercase tracking-wider text-ink disabled:opacity-60"
          >
            Try demo first
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
