'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/useAuth';
import { PasswordPolicyService } from '@/lib/auth/password-policy';

type Mode = 'request' | 'update';

interface PasswordResetFormProps {
  mode?: Mode;
}

export function PasswordResetForm({ mode = 'request' }: PasswordResetFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { resetPassword, updatePassword, error, clearError, user } = useAuth();

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setSuccessMessage('Password reset email sent');
    } catch {
      // AuthProvider surfaces error.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const validation = PasswordPolicyService.validatePassword(password, {
      email: user?.email ?? email,
    });

    if (!validation.isValid) {
      setLocalError(validation.errors.join('. '));
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setSuccessMessage('Password updated successfully');
    } catch {
      // AuthProvider surfaces error.
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">
            {mode === 'request' ? 'Reset password' : 'Set new password'}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === 'request'
              ? 'Enter your email to receive a password reset link'
              : 'Choose a strong password for your account'}
          </p>
        </div>

        {displayError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200"
          >
            {displayError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-4 rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200"
          >
            {successMessage}
          </div>
        )}

        {mode === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="border-zinc-700 bg-zinc-800 text-zinc-100"
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending...' : 'Reset password'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="border-zinc-700 bg-zinc-800 text-zinc-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="border-zinc-700 bg-zinc-800 text-zinc-100"
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-zinc-400">
          <Link
            href="/auth/login"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
