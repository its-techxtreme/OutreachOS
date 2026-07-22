import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ManagementDashboardClient } from '@/components/admin/ManagementDashboardClient';
import {
  adminDashboardDenyMessage,
  evaluateAdminDashboardAccess,
} from '@/lib/auth/admin-dashboard-gate';
import { getServerAuthUser } from '@/lib/auth/require-session';

export const metadata: Metadata = {
  title: 'Management dashboard',
  robots: { index: false, follow: false },
};

export default async function ManagementDashboardPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect('/admin/login');
  }

  const gate = evaluateAdminDashboardAccess(user);
  if (!gate.ok) {
    return (
      <div className="paper-texture flex min-h-screen items-center justify-center px-4">
        <div className="doodle-border max-w-lg bg-paper p-6">
          <h1 className="font-display text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {adminDashboardDenyMessage(gate.reason)}
          </p>
          {gate.reason === 'not_google' || gate.reason === 'unauthenticated' ? (
            <p className="mt-4 text-sm">
              <a href="/admin/login" className="underline">
                Sign in with Google
              </a>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return <ManagementDashboardClient />;
}
