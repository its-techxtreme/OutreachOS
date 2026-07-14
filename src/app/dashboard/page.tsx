'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return (
    <RouteGuard requireAuth>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <DashboardClient />
      </div>
    </RouteGuard>
  );
}
