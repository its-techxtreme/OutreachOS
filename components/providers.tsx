'use client';

import { CookieConsentBanner } from '@/components/site/CookieConsentBanner';
import { AuthProvider } from '@/lib/hooks/useAuth';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CookieConsentBanner />
    </AuthProvider>
  );
}
