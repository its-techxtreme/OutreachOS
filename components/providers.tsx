'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
