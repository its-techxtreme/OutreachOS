'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { Button } from '@/components/ui/button';
import { playSound } from '@/lib/sound';

type ManagedUser = {
  id: string;
  email: string | null;
  username: string | null;
  roles: string[];
  createdAt: string;
  leadCount: number;
  plan: string;
  providers: string[];
  disabled: boolean;
  disabledReason: string | null;
  disabledAt: string | null;
  subscription: {
    status: string;
    currency: string;
    currentPeriodEnd: string | null;
    subscriptionId: string | null;
    manualOverride: boolean;
  } | null;
};

export function ManagementDashboardClient() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [disableTarget, setDisableTarget] = useState<ManagedUser | null>(null);
  const [disableReason, setDisableReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/management/users?perPage=100');
      const data = (await res.json()) as {
        error?: string;
        users?: ManagedUser[];
      };
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to load users');
      }
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchUser = async (
    id: string,
    body: Record<string, unknown>
  ): Promise<void> => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/management/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Update failed');
      playSound('success');
      await load();
    } catch (err) {
      playSound('soft');
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDisable = async (): Promise<void> => {
    if (!disableTarget) return;
    const reason = disableReason.trim();
    if (reason.length < 3) {
      setError('Enter a disable reason (at least 3 characters).');
      return;
    }
    await patchUser(disableTarget.id, {
      disableAccount: true,
      disableReason: reason,
    });
    setDisableTarget(null);
    setDisableReason('');
  };

  return (
    <div className="paper-texture min-h-screen">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="doodle-border flex flex-wrap items-start justify-between gap-3 bg-paper p-4">
          <div>
            <BrandLockup size="sm" href="/dashboard" />
            <h1 className="mt-3 font-display text-3xl font-bold">
              Management dashboard
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Users, roles, Premium grants, and account disable / enable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="doodle-btn"
              onClick={() => void load()}
            >
              Refresh
            </Button>
            <Button asChild variant="outline" className="doodle-btn">
              <Link href="/dashboard">Vault</Link>
            </Button>
          </div>
        </header>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-ink-muted">Loading users…</p>
        ) : (
          <div className="overflow-x-auto doodle-border bg-paper">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b-2 border-ink/20 bg-paper-deep/50 font-label text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Leads</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-ink/10">
                    <td className="px-3 py-3 align-top">
                      <p className="font-medium">{user.email ?? '—'}</p>
                      <p className="text-xs text-ink-muted">
                        {user.username ? `@${user.username}` : 'no username'} ·{' '}
                        {user.roles.join(', ') || '—'}
                      </p>
                      <p className="font-mono text-[10px] text-ink-muted">
                        {user.id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top capitalize">{user.plan}</td>
                    <td className="px-3 py-3 align-top">{user.leadCount}</td>
                    <td className="px-3 py-3 align-top">
                      {user.disabled ? (
                        <div className="text-xs">
                          <p className="font-semibold text-danger">Disabled</p>
                          {user.disabledReason ? (
                            <p className="mt-1 max-w-[14rem] text-ink-muted">
                              {user.disabledReason}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-ink-muted">Active</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === user.id}
                          className="doodle-btn h-8 text-xs"
                          onClick={() =>
                            void patchUser(user.id, { grantPremium: true })
                          }
                        >
                          Grant Premium
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === user.id}
                          className="doodle-btn h-8 text-xs"
                          onClick={() =>
                            void patchUser(user.id, { revokePremium: true })
                          }
                        >
                          Revoke Premium
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === user.id}
                          className="doodle-btn h-8 text-xs"
                          onClick={() =>
                            void patchUser(user.id, { refreshRoles: true })
                          }
                        >
                          Refresh roles
                        </Button>
                        {user.disabled ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busyId === user.id}
                            className="doodle-btn h-8 text-xs"
                            onClick={() =>
                              void patchUser(user.id, { enableAccount: true })
                            }
                          >
                            Enable acc
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busyId === user.id}
                            className="doodle-btn h-8 text-xs text-danger"
                            onClick={() => {
                              setError(null);
                              setDisableReason('');
                              setDisableTarget(user);
                            }}
                          >
                            Disable acc
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {disableTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disable-acc-title"
        >
          <div className="doodle-border w-full max-w-md bg-paper p-5 shadow-lg">
            <h2
              id="disable-acc-title"
              className="font-display text-xl font-bold"
            >
              Disable account
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {disableTarget.email ?? disableTarget.id} will be signed out
              everywhere and blocked from logging in until you enable them
              again.
            </p>
            <label
              htmlFor="disable-reason"
              className="mt-4 block font-label text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Reason (shown to the user)
            </label>
            <textarea
              id="disable-reason"
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="doodle-input mt-1 min-h-[6rem] w-full resize-y"
              placeholder="Why is this account being disabled?"
              autoFocus
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="doodle-btn"
                onClick={() => {
                  setDisableTarget(null);
                  setDisableReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="doodle-btn"
                disabled={busyId === disableTarget.id}
                onClick={() => void confirmDisable()}
              >
                Disable account
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
