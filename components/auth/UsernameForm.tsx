'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { DoodleDecor } from '@/components/landing/DoodleDecor';
import { useAuth } from '@/lib/hooks/useAuth';
import { playSound } from '@/lib/sound';
import {
  USERNAME_MAX,
  USERNAME_MIN,
  parseUsername,
  userNeedsUsername,
} from '@/lib/validation/username-schema';

export function UsernameForm() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questBoardEnabled, setQuestBoardEnabled] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (!userNeedsUsername(user)) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const parsed = parseUsername(username);
    if (!parsed.ok) {
      setAvailable(null);
      setHint(username.trim() ? parsed.error : null);
      return;
    }

    setHint(null);
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/profile/username?username=${encodeURIComponent(parsed.username)}`
          );
          const body = (await response.json()) as {
            available?: boolean;
            error?: string;
          };
          if (!response.ok) {
            setAvailable(false);
            setHint(body.error ?? 'Could not check username');
            return;
          }
          setAvailable(Boolean(body.available));
          setHint(
            body.available ? 'Username is available' : 'Username is taken'
          );
        } catch {
          setAvailable(null);
          setHint('Could not check username');
        }
      })();
    }, 350);

    return () => window.clearTimeout(handle);
  }, [username]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setIsSubmitting(true);

      try {
        const response = await fetch('/api/profile/username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, questBoardEnabled }),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? 'Could not save username');
        }
        playSound('success');
        // Soft router.replace leaves useAuth with a stale user (no username yet),
        // so RouteGuard bounces back here. Full navigation remounts auth fresh.
        try {
          sessionStorage.setItem('outreachos:show-demo-tutorial-tip', '1');
        } catch {
          // ignore private-mode quota errors
        }
        window.location.assign('/dashboard');
      } catch (err) {
        playSound('soft');
        setError(err instanceof Error ? err.message : 'Could not save username');
        setIsSubmitting(false);
      }
    },
    [username, questBoardEnabled]
  );

  if (loading || !user || !userNeedsUsername(user)) {
    return (
      <div className="paper-texture flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="auth-stage paper-texture flex min-h-screen items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <DoodleDecor />
      <div className="glass-panel relative z-10 w-full max-w-md p-5 sm:p-8 md:p-10">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <BrandLockup size="lg" href="/" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">
            Pick a username
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            This is how you appear in OutreachOS — and how you can sign in
            later.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-danger/40 bg-white/50 px-3 py-2 text-sm text-danger"
          >
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-1">
            <label
              htmlFor="username"
              className="font-label text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              data-testid="username-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="doodle-input"
              minLength={USERNAME_MIN}
              maxLength={USERNAME_MAX}
              required
              spellCheck={false}
            />
            <p className="text-xs text-ink-muted">
              {USERNAME_MIN}–{USERNAME_MAX} characters · start with a letter ·
              lowercase letters, numbers, underscore
            </p>
            {hint && (
              <p
                className={`text-xs ${
                  available === true
                    ? 'text-marker'
                    : available === false
                      ? 'text-danger'
                      : 'text-ink-muted'
                }`}
                data-testid="username-hint"
              >
                {hint}
              </p>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-ink/15 bg-white/40 px-3 py-3 text-sm text-ink">
            <input
              type="checkbox"
              data-testid="quest-board-opt-in"
              checked={questBoardEnabled}
              onChange={(event) => setQuestBoardEnabled(event.target.checked)}
              className="mt-1 h-4 w-4 accent-marker"
            />
            <span>
              <span className="font-medium">Turn on Quest Board</span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                Weekly dial challenges to keep cold calling fun. You can change
                this later in Account.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || available === false}
            className="doodle-btn w-full rounded-md bg-coral/95 py-3 font-label text-sm font-bold uppercase tracking-wider text-ink disabled:opacity-60"
            data-testid="username-submit"
          >
            {isSubmitting ? 'Saving…' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          <button
            type="button"
            className="text-marker underline decoration-2 underline-offset-2"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
          {' · '}
          <Link
            href="/terms"
            className="underline decoration-marker underline-offset-2"
          >
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
