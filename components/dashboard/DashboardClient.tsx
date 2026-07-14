'use client';

import { Suspense, lazy } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const DashboardView = lazy(() =>
  import('@/components/dashboard/DashboardView').then((module) => ({
    default: module.DashboardView,
  }))
);

function DashboardFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-16" />
      <Skeleton className="h-[600px]" />
    </div>
  );
}

export function DashboardClient() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardView />
    </Suspense>
  );
}
