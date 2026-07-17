'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { DoodleDecor } from '@/components/landing/DoodleDecor';
import { useAuth } from '@/lib/hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } catch {
      // Error via AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-stage paper-texture flex min-h-screen items-center justify-center px-4 py-12">
      <DoodleDecor />
      <div className="glass-panel relative z-10 w-full max-w-md p-8 md:p-10">
        <div className="mb-6 text-center">
          <p className="font-display text-4xl font-bold text-ink">
            Outreach<span className="text-marker">OS</span>
          </p>
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
              htmlFor="email"
              className="font-label text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              data-testid="email-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="doodle-input"
              required
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
          onClick={() => void signInWithGoogle()}
          className="doodle-btn mb-3 w-full rounded-md bg-white/55 py-3 font-label text-sm font-bold uppercase tracking-wider text-ink backdrop-blur-sm"
          data-testid="google-signin-button"
        >
          Continue with Google
        </button>

        <button
          type="button"
          disabled={demoLoading}
          onClick={() => {
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
      </div>
    </div>
  );
}
