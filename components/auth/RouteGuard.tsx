'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/hooks/useAuth';
import { logger } from '@/lib/logger';
import { userNeedsUsername } from '@/lib/validation/username-schema';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  roles?: string[];
  /** When true (default), users without a username are sent to /auth/username */
  requireUsername?: boolean;
}

function GuardSpinner() {
  return (
    <div className="paper-texture flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function RouteGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  roles = [],
  requireUsername = true,
}: RouteGuardProps) {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (requireAuth && !session) {
      setRedirecting(true);
      router.replace(redirectTo);
      return;
    }

    if (requireAuth && requireUsername && user && userNeedsUsername(user)) {
      setRedirecting(true);
      router.replace('/auth/username');
      return;
    }

    if (roles.length > 0 && user) {
      const userRoles = (user.app_metadata?.roles as string[] | undefined) ?? [];
      const hasRequiredRole = roles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        logger.warn('Access denied - insufficient roles', {
          userId: user.id,
          requiredRoles: roles,
          userRoles,
        });
        setRedirecting(true);
        router.replace('/auth/unauthorized');
        return;
      }
    }

    setRedirecting(false);
  }, [
    user,
    session,
    loading,
    requireAuth,
    requireUsername,
    redirectTo,
    roles,
    router,
  ]);

  if (loading || redirecting) {
    return <GuardSpinner />;
  }

  // Never return null — blank white page after soft login navigation.
  if (requireAuth && !session) {
    return <GuardSpinner />;
  }

  if (requireAuth && requireUsername && user && userNeedsUsername(user)) {
    return <GuardSpinner />;
  }

  return <>{children}</>;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RouteGuardProps, 'children'> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RouteGuard {...options}>
        <Component {...props} />
      </RouteGuard>
    );
  };
}
