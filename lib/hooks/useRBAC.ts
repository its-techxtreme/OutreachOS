'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Permission, Role, RBACService } from '@/lib/auth/rbac';

export function useRBAC() {
  const { user } = useAuth();

  return {
    user,
    hasPermission: (permission: Permission) =>
      RBACService.hasPermission(user, permission),
    hasRole: (role: Role) => RBACService.hasRole(user, role),
    canAccessRoute: (route: string) => RBACService.canAccessRoute(user, route),
    permissions: RBACService.getUserPermissions(user),
    roles: RBACService.getUserRoles(user),
  };
}
