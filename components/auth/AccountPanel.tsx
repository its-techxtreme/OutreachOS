'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  LogOut,
  ScrollText,
  Shield,
  Trash2,
  User as UserIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import { MFASetup } from '@/components/auth/MFASetup';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUserDisplayName } from '@/lib/auth/display-name';
import { PasswordPolicyService } from '@/lib/auth/password-policy';
import { RBACService, Role } from '@/lib/auth/rbac';
import { useAuth } from '@/lib/hooks/useAuth';
import { isSoundMuted, playSound, setSoundMuted } from '@/lib/sound';

const DELETE_CONFIRMATION = 'delete';

function roleLabel(roles: Role[]): string {
  if (roles.includes(Role.SUPER_ADMIN)) return 'Super admin';
  if (roles.includes(Role.ADMIN)) return 'Admin';
  if (roles.includes(Role.MANAGER)) return 'Manager';
  if (roles.includes(Role.PREMIUM)) return 'Premium';
  if (roles.includes(Role.DEMO)) return 'Demo';
  if (roles.includes(Role.USER)) return 'Member';
  if (roles.includes(Role.VIEWER)) return 'Viewer';
  return 'Account';
}

function canSelfDelete(roles: Role[]): boolean {
  return (
    !roles.includes(Role.DEMO) &&
    !roles.includes(Role.ADMIN) &&
    !roles.includes(Role.SUPER_ADMIN)
  );
}

function AccountSection({
  title,
  description,
  children,
  testId,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="doodle-border bg-paper p-4 sm:p-6"
    >
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DeleteAccountSection({ canDelete }: { canDelete: boolean }) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmation.trim() === DELETE_CONFIRMATION;

  const handleDelete = async () => {
    if (!confirmed || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: confirmation.trim() }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? 'Could not delete account');
      }
      playSound('soft');
      try {
        await signOut();
      } catch {
        /* account already gone */
      }
      window.location.assign('/');
    } catch (err) {
      playSound('soft');
      setError(err instanceof Error ? err.message : 'Could not delete account');
      setBusy(false);
    }
  };

  return (
    <AccountSection
      title="Delete account"
      description="Permanently remove your account and personal lead vault."
      testId="account-delete"
    >
      {!canDelete ? (
        <p className="text-sm text-ink-muted">
          This account type cannot be self-deleted. Email{' '}
          <a
            href="mailto:techxtremebuisness@gmail.com"
            className="underline decoration-marker underline-offset-2"
          >
            techxtremebuisness@gmail.com
          </a>{' '}
          if you need help.
        </p>
      ) : !open ? (
        <Button
          type="button"
          variant="outline"
          data-testid="account-delete-open"
          className="doodle-btn border-danger text-danger hover:bg-danger/10"
          onClick={() => {
            playSound('tap');
            setOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete my account
        </Button>
      ) : (
        <div className="space-y-4" data-testid="account-delete-confirm">
          <p className="text-sm text-ink-muted">
            This cannot be undone. Your profile and owned leads will be removed.
            Type <span className="font-mono font-semibold text-ink">delete</span>{' '}
            to confirm.
          </p>
          <div className="space-y-1">
            <Label htmlFor="delete-confirmation">Confirmation</Label>
            <Input
              id="delete-confirmation"
              data-testid="account-delete-input"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="delete"
              className="doodle-input border-ink bg-paper-deep"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="doodle-btn border-ink bg-paper"
              onClick={() => {
                setOpen(false);
                setConfirmation('');
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!confirmed || busy}
              data-testid="account-delete-submit"
              className="doodle-btn bg-danger text-white disabled:opacity-45"
              onClick={() => void handleDelete()}
            >
              <Trash2 className="h-4 w-4" />
              {busy ? 'Deleting…' : 'Permanently delete'}
            </Button>
          </div>
        </div>
      )}
    </AccountSection>
  );
}

function ChangePasswordForm({ user }: { user: User }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      playSound('soft');
      return;
    }

    const validation = PasswordPolicyService.validatePassword(password, {
      email: user.email ?? undefined,
      name: getUserDisplayName(user),
    });
    if (!validation.isValid) {
      setError(validation.errors[0] ?? 'Password does not meet policy');
      playSound('soft');
      return;
    }

    setBusy(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirm('');
      setSuccess('Password updated');
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password');
      playSound('soft');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4"
      data-testid="change-password-form"
    >
      <div className="space-y-1">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="doodle-input border-ink bg-paper-deep"
          required
          minLength={12}
        />
        <p className="text-xs text-ink-muted">
          At least 12 characters with upper, lower, number, and symbol.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="doodle-input border-ink bg-paper-deep"
          required
          minLength={12}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-marker">
          {success}
        </p>
      )}
      <Button
        type="submit"
        disabled={busy}
        className="doodle-btn bg-coral/95 text-ink"
        data-testid="change-password-submit"
      >
        <KeyRound className="h-4 w-4" />
        {busy ? 'Saving…' : 'Update password'}
      </Button>
    </form>
  );
}

export function AccountPanel({ user }: { user: User }) {
  const { signOut, loading, linkGoogleIdentity } = useAuth();
  const roles = useMemo(() => RBACService.getUserRoles(user), [user]);
  const isDemo = RBACService.isDemoUser(user);
  const isPremium = roles.includes(Role.PREMIUM);
  const isAdmin =
    roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN);
  const displayName = getUserDisplayName(user);
  const username =
    typeof user.user_metadata?.username === 'string'
      ? user.user_metadata.username.trim()
      : '';
  const initial = (displayName.charAt(0) || 'A').toUpperCase();
  const [muted, setMuted] = useState(true);
  const [questEnabled, setQuestEnabled] = useState(false);
  const [questBusy, setQuestBusy] = useState(false);
  const [questError, setQuestError] = useState<string | null>(null);
  const [billingPlan, setBillingPlan] = useState<'free' | 'premium' | 'admin'>(
    isAdmin ? 'admin' : isPremium ? 'premium' : 'free'
  );
  const hasGoogle = Boolean(
    (Array.isArray(user.app_metadata?.providers) &&
      user.app_metadata.providers.includes('google')) ||
      user.app_metadata?.provider === 'google' ||
      (Array.isArray(user.identities) &&
        user.identities.some((identity) => identity.provider === 'google'))
  );

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/billing/status');
        const payload = (await response.json()) as {
          plan?: 'free' | 'premium' | 'admin';
        };
        if (!cancelled && response.ok && payload.plan) {
          setBillingPlan(payload.plan);
        }
      } catch {
        /* keep role-derived plan */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/quests');
        const payload = (await response.json()) as {
          enabled?: boolean;
          error?: string;
        };
        if (!cancelled && response.ok) {
          setQuestEnabled(Boolean(payload.enabled));
        }
      } catch {
        // Prefer silent fail; toggle still attempts PATCH
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleQuestBoard = async () => {
    if (isDemo && questEnabled) {
      setQuestError('Quest Board stays on for the demo account');
      return;
    }
    setQuestBusy(true);
    setQuestError(null);
    const next = !questEnabled;
    try {
      const response = await fetch('/api/quests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Could not update Quest Board');
      }
      setQuestEnabled(next);
      playSound(next ? 'checkpoint' : 'soft');
    } catch (err) {
      setQuestError(
        err instanceof Error ? err.message : 'Could not update Quest Board'
      );
      playSound('soft');
    } finally {
      setQuestBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-3 sm:gap-6 sm:p-6" data-testid="account-panel">
      <header className="doodle-border flex flex-col gap-3 bg-paper px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-4">
        <div className="min-w-0">
          <BrandLockup size="md" href="/dashboard" />
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
            Account
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your vault profile, security, and preferences.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          className="doodle-btn shrink-0 border-ink bg-paper self-start"
        >
          <Link href="/dashboard">Back to vault</Link>
        </Button>
      </header>

      <AccountSection
        title="Profile"
        description="How you appear in OutreachOS."
        testId="account-profile"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-highlighter font-display text-2xl font-bold text-ink"
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <UserIcon className="h-4 w-4 text-ink-muted" aria-hidden />
              {displayName}
            </p>
            {username ? (
              <p className="font-mono text-sm text-marker">@{username}</p>
            ) : (
              <p className="text-sm text-ink-muted">
                No username yet —{' '}
                <Link
                  href="/auth/username"
                  className="underline decoration-marker underline-offset-2"
                >
                  pick one
                </Link>
              </p>
            )}
            <p className="truncate text-sm text-ink-muted">
              {user.email ?? 'No email on file'}
            </p>
            <span className="inline-flex rounded-md border border-ink bg-paper-deep px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider text-ink">
              {roleLabel(roles)}
            </span>
            {billingPlan === 'premium' || isPremium ? (
              <span className="ml-2 inline-flex rounded-md border border-ink bg-highlighter px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider text-ink">
                Premium
              </span>
            ) : null}
          </div>
        </div>
        {username ? (
          <p className="mt-4 text-xs text-ink-muted">
            Usernames stay fixed after you choose them so sign-in stays stable.
          </p>
        ) : null}
      </AccountSection>

      {!isDemo ? (
        <AccountSection
          title="Billing"
          description="Free vault or Premium unlimited leads — request upgrade by email for now."
          testId="account-billing"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-ink">
                Plan:{' '}
                {billingPlan === 'admin'
                  ? 'Admin (full access)'
                  : billingPlan === 'premium'
                    ? 'Premium'
                    : 'Free'}
              </p>
              <p className="text-sm text-ink-muted">
                Premium is ₹1499 or $15 / month. Request upgrade from Pricing —
                your email draft includes your username.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {billingPlan === 'free' ? (
                <Button asChild className="doodle-btn bg-coral text-ink">
                  <Link href="/pricing">Request Premium</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="doodle-btn">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </AccountSection>
      ) : null}

      {!isDemo ? (
        <AccountSection
          title="Linked sign-in"
          description="Link Google to use the admin management console with the same account."
          testId="account-linked-auth"
        >
          {hasGoogle ? (
            <p className="text-sm text-ink-muted">
              Google is linked to this account.
            </p>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="doodle-btn"
              onClick={() => {
                playSound('tap');
                void linkGoogleIdentity('/settings');
              }}
            >
              Link Google
            </Button>
          )}
        </AccountSection>
      ) : null}

      <AccountSection
        title="Security"
        description={
          isDemo
            ? 'Demo accounts use shared credentials — password and MFA stay locked.'
            : 'Keep your vault locked down.'
        }
        testId="account-security"
      >
        {isDemo ? (
          <div className="doodle-border-soft bg-paper-deep px-4 py-3 text-sm text-ink-muted">
            <Shield className="mb-2 h-4 w-4 text-ink" aria-hidden />
            Sign up for a personal account to set your own password and enable
            MFA.
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="font-label text-xs font-bold uppercase tracking-wider text-ink-muted">
                Password
              </h3>
              <div className="mt-3">
                <ChangePasswordForm user={user} />
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                Prefer email recovery?{' '}
                <Link
                  href="/auth/reset-password"
                  className="underline decoration-marker underline-offset-2"
                >
                  Send a reset link
                </Link>
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-label text-xs font-bold uppercase tracking-wider text-ink-muted">
                Multi-factor authentication
              </h3>
              <MFASetup user={{ id: user.id, email: user.email }} />
            </div>
          </div>
        )}
      </AccountSection>

      <AccountSection
        title="Preferences"
        description="Sounds are local to this browser. Quest Board syncs to your account."
        testId="account-preferences"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-ink">Interface sounds</p>
              <p className="text-sm text-ink-muted">
                Soft taps, whooshes, and tutorial checkpoint chimes.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              data-testid="account-sound-toggle"
              className="doodle-btn border-ink bg-paper"
              onClick={() => {
                const next = !muted;
                setSoundMuted(next);
                setMuted(next);
                if (!next) {
                  playSound('pop');
                }
              }}
            >
              {muted ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  Unmute
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  Mute
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
            <div>
              <p className="font-medium text-ink">Quest Board</p>
              <p className="text-sm text-ink-muted">
                Weekly dial challenges. Completing call statuses advances matching
                quests.
              </p>
              {questError && (
                <p role="alert" className="mt-1 text-xs text-danger">
                  {questError}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={questBusy || (isDemo && questEnabled)}
              data-testid="account-quest-toggle"
              className="doodle-btn border-ink bg-paper"
              onClick={() => void toggleQuestBoard()}
            >
              <ScrollText className="h-4 w-4" />
              {questEnabled ? 'Turn off' : 'Turn on'}
            </Button>
          </div>
        </div>
      </AccountSection>

      <AccountSection
        title="Legal"
        description="Policies that cover how OutreachOS runs."
        testId="account-legal"
      >
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {[
            ['/terms', 'Terms'],
            ['/privacy', 'Privacy'],
            ['/cookies', 'Cookies'],
            ['/acceptable-use', 'Acceptable Use'],
            ['/accessibility', 'Accessibility'],
          ].map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="text-marker underline decoration-2 underline-offset-2"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </AccountSection>

      <AccountSection
        title="Session"
        description="Sign out of this browser session."
        testId="account-session"
      >
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          data-testid="account-sign-out"
          className="doodle-btn border-danger text-danger hover:bg-danger/10"
          onClick={() => {
            playSound('soft');
            void signOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </AccountSection>

      <DeleteAccountSection canDelete={canSelfDelete(roles)} />
    </div>
  );
}
