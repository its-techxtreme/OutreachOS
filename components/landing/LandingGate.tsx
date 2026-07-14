'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function LandingGate() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      data-testid="landing-gate"
      className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/brand/constellation-field.png"
          alt=""
          fill
          priority
          className="object-cover opacity-70 mix-blend-screen"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/75 via-zinc-950/55 to-zinc-950" />
        <div className="atmosphere-radial absolute inset-0" />
        <div className="ops-grid absolute inset-0 opacity-[0.04]" />
        {!reduceMotion && (
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(45,212,191,0.12),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(56,189,248,0.08),transparent_40%)]"
            animate={{ opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      <header className="relative z-10 flex items-center px-6 py-6 md:px-10">
        <Image
          src="/brand/outreachos-mark.png"
          alt="OutreachOS"
          width={32}
          height={32}
          className="h-8 w-8 object-contain opacity-90"
          priority
        />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="font-display text-6xl font-bold tracking-tighter text-white drop-shadow-sm md:text-8xl">
            Outreach<span className="text-teal-400">OS</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-xl font-light tracking-wide text-zinc-400 md:text-2xl">
            Command your prospecting pipeline with precision.
          </p>
          <div className="pt-10">
            <Link
              href="/dashboard"
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-teal-400 px-8 text-sm font-semibold uppercase tracking-wider text-zinc-950 shadow-[0_0_24px_rgba(45,212,191,0.25)] transition-all duration-300 hover:bg-teal-300 hover:shadow-[0_0_32px_rgba(45,212,191,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
