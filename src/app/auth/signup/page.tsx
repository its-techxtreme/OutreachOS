import { Suspense } from 'react';

import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="paper-texture flex min-h-screen items-center justify-center text-ink-muted">
          Loading…
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
