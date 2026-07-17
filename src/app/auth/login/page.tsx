'use client';

import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="paper-texture flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
