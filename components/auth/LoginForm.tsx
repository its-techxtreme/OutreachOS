'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, error, clearError } = useAuth();
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
      // Error is surfaced via AuthProvider state.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">OutreachOS</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to access your lead management dashboard
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200"
          >
            {/invalid|credentials|password|email/i.test(error)
              ? 'Invalid credentials'
              : error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              data-testid="email-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              data-testid="password-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            data-testid="login-button"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          <Link
            href="/auth/reset-password"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
