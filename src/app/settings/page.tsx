'use client';

import { AccountPanel } from '@/components/auth/AccountPanel';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SettingsPage() {
  const { user, loading } = useAuth();

  return (
    <RouteGuard requireAuth>
      <div className="paper-texture min-h-screen text-ink">
        {loading || !user ? (
          <div className="flex min-h-screen items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <AccountPanel user={user} />
        )}
      </div>
    </RouteGuard>
  );
}
