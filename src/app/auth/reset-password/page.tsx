'use client';

import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ResetPasswordPage() {
  const { session } = useAuth();

  return (
    <PasswordResetForm mode={session ? 'update' : 'request'} />
  );
}
