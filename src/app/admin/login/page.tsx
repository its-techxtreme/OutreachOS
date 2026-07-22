'use client';

import { useState } from 'react';
import Link from 'next/link';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { playSound } from '@/lib/sound';

export default function AdminLoginPage() {
  const { signInWithGoogle, loading, error } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <div className="paper-texture flex min-h-screen flex-col items-center justify-center px-4">
      <div className="doodle-border w-full max-w-md bg-paper p-6 sm:p-8">
        <BrandLockup size="md" href="/" />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">
          Admin console
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Google sign-in only. Use the allowlisted admin Google account.
        </p>
        <Button
          type="button"
          disabled={loading || busy}
          className="mt-6 doodle-btn w-full border-ink bg-coral text-ink"
          onClick={() => {
            setBusy(true);
            playSound('tap');
            void signInWithGoogle('/admin/management-dashboard').finally(() =>
              setBusy(false)
            );
          }}
        >
          Continue with Google
        </Button>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Looking for the lead vault?{' '}
          <Link href="/auth/login" className="underline">
            App login
          </Link>
        </p>
      </div>
    </div>
  );
}
