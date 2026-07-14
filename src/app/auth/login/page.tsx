'use client';

import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
