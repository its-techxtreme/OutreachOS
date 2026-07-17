'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

import { DoodleDecor } from '@/components/landing/DoodleDecor';
import { MascotCallout } from '@/components/mascots/MascotCallout';
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
      className="paper-texture relative min-h-screen overflow-hidden text-ink"
    >
      <DoodleDecor />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <p className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Outreach<span className="text-marker">OS</span>
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/signup"
            className="hidden font-label text-sm font-semibold uppercase tracking-wide text-ink-muted underline decoration-2 underline-offset-4 hover:text-ink sm:inline"
          >
            Get started
          </Link>
          <Link
            href="/auth/login"
            className="font-label text-sm font-semibold uppercase tracking-wide text-ink-muted underline decoration-2 underline-offset-4 hover:text-ink"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[78vh] max-w-5xl flex-col items-center justify-center px-6 pb-12 text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="w-full"
        >
          <p className="mb-4 font-label text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            cold outreach, without the spreadsheet headache
          </p>
          <h1 className="font-display text-6xl font-bold leading-[0.95] tracking-tight text-ink md:text-8xl">
            Outreach<span className="text-marker">OS</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold leading-snug text-ink md:text-4xl">
            Your leads. Your vault.{' '}
            <span className="highlighter-wash px-1">Nobody else&apos;s mess.</span>
          </p>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl">
            Stop hunting contacts across tabs and half-finished sheets. Drop them
            in, filter what matters today, and keep every account private — like
            a notebook that actually stays organized.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
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
          <p className="mt-5 text-sm text-ink-muted">
            No sales call. No credit card. Just your own empty vault in under a minute.
          </p>
        </motion.div>
      </main>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16">
        <hr className="wobbly-divider mb-12" />
        <h2 className="font-display text-center text-4xl font-bold text-ink md:text-5xl">
          Built for people who actually dial
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-ink-muted">
          Freelancers, tiny agencies, solo founders — anyone tired of “wait, did I
          already message this place?” at 11pm.
        </p>
        <ul className="mt-12 grid gap-10 md:grid-cols-3">
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
              <span className="font-display text-5xl font-bold text-marker/80">
                {item.scribble}
              </span>
              <h3 className="mt-2 font-display text-2xl font-bold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16">
        <div className="doodle-border rotate-[-0.4deg] bg-highlighter/35 px-6 py-8 md:px-10">
          <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
            What you get on the free plan
          </h2>
          <p className="mt-3 max-w-xl text-ink-muted">
            Enough runway to run real outreach — not a toy that locks after five
            rows.
          </p>
          <ul className="mt-6 space-y-3 text-ink">
            {[
              'Up to 500 leads in your personal vault',
              '10 Excel imports per day (200 rows each)',
              'Filters, export, and status tracking',
              'Email + password (verified) or Google sign-in',
              'One-click demo if you just want to poke around first',
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  className="mt-1 inline-block h-2.5 w-2.5 rotate-12 bg-coral"
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10">
          <MascotCallout mascot="citygirl" title="Start empty. That’s the point.">
            New accounts don’t inherit anyone else’s leads. Import your sheet, and
            Mira will stay out of the way while you fill the vault.
          </MascotCallout>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24 text-center">
        <h2 className="font-display text-4xl font-bold text-ink">
          Ready when you are
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-ink-muted">
          Make an account, import a sheet, and stop treating Maps links like a
          scavenger hunt.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

      <footer className="relative z-10 border-t-2 border-ink/20 px-6 py-8 text-center text-sm text-ink-muted">
        OutreachOS — personal lead management for people who ship outreach, not
        slides about outreach.
      </footer>
    </div>
  );
}
