'use client';

import { useState } from 'react';
import Link from 'next/link';

import { DoodleDecor } from '@/components/landing/DoodleDecor';
import { useAuth } from '@/lib/hooks/useAuth';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { signUp, signInWithGoogle, error, clearError } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setLocalError(null);

    if (password !== confirm) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp(email, password);
      if (result.needsEmailConfirmation) {
        setCheckEmail(true);
      }
    } catch {
      // AuthProvider error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkEmail) {
    return (
      <div className="auth-stage paper-texture flex min-h-screen items-center justify-center px-4 py-12">
        <DoodleDecor />
        <div
          className="glass-panel relative z-10 w-full max-w-md p-8 text-center md:p-10"
          data-testid="verify-email-prompt"
        >
          <p className="font-display text-4xl font-bold text-ink">
            Check your inbox
          </p>
          <p className="mt-4 text-ink-muted">
            We sent a verification link to <strong>{email}</strong>. Tap it and
            your empty vault is ready — no shared pool, just yours.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 inline-block font-label text-sm font-bold uppercase text-marker underline decoration-2 underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const displayError = localError ?? error;

  return (
    <div className="auth-stage paper-texture flex min-h-screen items-center justify-center px-4 py-12">
      <DoodleDecor />
      <div className="glass-panel relative z-10 w-full max-w-md p-8 md:p-10">
        <div className="mb-6 text-center">
          <p className="font-display text-4xl font-bold text-ink">
            Join Outreach<span className="text-marker">OS</span>
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Fresh vault · 500 leads · verified email — then you&apos;re dialing.
          </p>
        </div>

        {displayError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-danger/40 bg-white/50 px-3 py-2 text-sm text-danger backdrop-blur-sm"
          >
            {displayError}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-1">
            <label
              htmlFor="signup-email"
              className="font-label text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              data-testid="signup-email-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="doodle-input"
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="signup-password"
              className="font-label text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              data-testid="signup-password-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="doodle-input"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="signup-confirm"
              className="font-label text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Confirm password
            </label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              data-testid="signup-confirm-input"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="doodle-input"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="doodle-btn w-full rounded-md bg-coral/95 py-3 font-label text-sm font-bold uppercase tracking-wider text-ink disabled:opacity-60"
            data-testid="signup-button"
          >
            {isSubmitting ? 'Creating…' : 'Create account'}
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
          className="doodle-btn w-full rounded-md bg-white/55 py-3 font-label text-sm font-bold uppercase tracking-wider text-ink backdrop-blur-sm"
          data-testid="google-signup-button"
        >
          Sign up with Google
        </button>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-marker underline decoration-2 underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
