'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/hooks/useAuth';
import { logger } from '@/lib/logger';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  roles?: string[];
}

export function RouteGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  roles = [],
}: RouteGuardProps) {
  const { user, session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (requireAuth && !session) {
      router.push(redirectTo);
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
        router.push('/auth/unauthorized');
      }
    }
  }, [user, session, loading, requireAuth, redirectTo, roles, router]);

  if (loading) {
    return (
      <div className="paper-texture flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (requireAuth && !session) {
    return null;
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
