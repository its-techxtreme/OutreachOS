'use client';

import { useState } from 'react';
import Link from 'next/link';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { DoodleDecor } from '@/components/landing/DoodleDecor';
import { useAuth } from '@/lib/hooks/useAuth';
import { playSound } from '@/lib/sound';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const {
    signIn,
    signInWithGoogle,
    signInAsDemo,
    error,
    clearError,
  } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await signIn(identifier, password);
      playSound('success');
    } catch {
      playSound('soft');
      // Error via AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-stage paper-texture flex min-h-screen items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <DoodleDecor />
      <div className="glass-panel relative z-10 w-full max-w-md p-5 sm:p-8 md:p-10">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <BrandLockup size="lg" href="/" />
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Welcome back — grab your vault and keep dialing.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-danger/40 bg-white/50 px-3 py-2 text-sm text-danger backdrop-blur-sm"
          >
            {/invalid|credentials|password|email/i.test(error)
              ? 'Invalid credentials'
              : error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label
              htmlFor="identifier"
              className="font-label text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Email or username
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              data-testid="email-input"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="doodle-input"
              required
              spellCheck={false}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="font-label text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              data-testid="password-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="doodle-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="doodle-btn w-full rounded-md bg-coral/95 py-3 font-label text-sm font-bold uppercase tracking-wider text-ink disabled:opacity-60"
            data-testid="login-button"
            onClick={() => playSound('tap')}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <hr className="wobbly-divider flex-1 opacity-40" />
          <span className="font-label text-xs uppercase text-ink-muted">or</span>
          <hr className="wobbly-divider flex-1 opacity-40" />
        </div>

        <button
          type="button"
          onClick={() => {
            playSound('tap');
            void signInWithGoogle();
          }}
          className="doodle-btn mb-3 w-full rounded-md bg-white/55 py-3 font-label text-sm font-bold uppercase tracking-wider text-ink backdrop-blur-sm"
          data-testid="google-signin-button"
        >
          Continue with Google
        </button>

        <button
          type="button"
          disabled={demoLoading}
          onClick={() => {
            playSound('whoosh');
            setDemoLoading(true);
            void signInAsDemo().finally(() => setDemoLoading(false));
          }}
          className="doodle-btn w-full rounded-md bg-highlighter/90 py-3 font-label text-sm font-bold uppercase tracking-wider text-ink disabled:opacity-60"
          data-testid="demo-signin-button"
        >
          {demoLoading ? 'Opening demo…' : 'Sign in as Demo'}
        </button>

        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link
            href="/auth/reset-password"
            className="text-marker underline decoration-2 underline-offset-2"
          >
            Forgot password?
          </Link>
          {' · '}
          <Link
            href="/auth/signup"
            className="text-marker underline decoration-2 underline-offset-2"
          >
            Create account
          </Link>
        </p>
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-muted">
          By signing in you continue under our{' '}
          <Link
            href="/terms"
            className="underline decoration-marker underline-offset-2"
          >
            Terms
          </Link>
          ,{' '}
          <Link
            href="/privacy"
            className="underline decoration-marker underline-offset-2"
          >
            Privacy Policy
          </Link>
          , and{' '}
          <Link
            href="/acceptable-use"
            className="underline decoration-marker underline-offset-2"
          >
            Acceptable Use
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
