'use client';

import { MFASetup } from '@/components/auth/MFASetup';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { UserMenu } from '@/components/auth/UserMenu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Permission } from '@/lib/auth/rbac';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRBAC } from '@/lib/hooks/useRBAC';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { hasPermission } = useRBAC();

  if (!loading && user && !hasPermission(Permission.SYSTEM_SETTINGS)) {
    return (
      <RouteGuard requireAuth>
        <div className="paper-texture flex min-h-screen items-center justify-center px-6 text-center text-ink-muted">
          <p>Security settings are not available for this account.</p>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireAuth>
      <div className="paper-texture min-h-screen text-ink">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Security settings
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                Manage authentication and multi-factor security for your account.
              </p>
            </div>
            <UserMenu />
          </header>

          {loading || !user ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <MFASetup user={{ id: user.id, email: user.email }} />
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
