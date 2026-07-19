export enum Permission {
  LEADS_VIEW = 'leads:view',
  LEADS_CREATE = 'leads:create',
  LEADS_UPDATE = 'leads:update',
  LEADS_DELETE = 'leads:delete',
  LEADS_EXPORT = 'leads:export',
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_METRICS = 'system:metrics',
  API_KEYS_MANAGE = 'api:keys:manage',
  API_LOGS_VIEW = 'api:logs:view',
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  /** Standard public signup — personal CRM only. */
  USER = 'user',
  VIEWER = 'viewer',
  /** Public community demo account — intentionally limited. */
  DEMO = 'demo',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.LEADS_VIEW,
    Permission.LEADS_CREATE,
    Permission.LEADS_UPDATE,
    Permission.LEADS_DELETE,
    Permission.LEADS_EXPORT,
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_UPDATE,
    Permission.SYSTEM_SETTINGS,
    Permission.SYSTEM_LOGS,
    Permission.SYSTEM_METRICS,
    Permission.API_KEYS_MANAGE,
  ],
  [Role.MANAGER]: [
    Permission.LEADS_VIEW,
    Permission.LEADS_CREATE,
    Permission.LEADS_UPDATE,
    Permission.LEADS_EXPORT,
    Permission.USERS_VIEW,
  ],
  [Role.USER]: [
    Permission.LEADS_VIEW,
    Permission.LEADS_CREATE,
    Permission.LEADS_UPDATE,
    Permission.LEADS_DELETE,
    Permission.LEADS_EXPORT,
  ],
  [Role.VIEWER]: [Permission.LEADS_VIEW],
  [Role.DEMO]: [
    Permission.LEADS_VIEW,
    Permission.LEADS_CREATE,
    Permission.LEADS_EXPORT,
  ],
};

const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/dashboard': [Permission.LEADS_VIEW],
  '/admin/leads': [Permission.LEADS_VIEW],
  '/admin/leads/create': [Permission.LEADS_CREATE],
  '/admin/leads/edit': [Permission.LEADS_UPDATE],
  '/admin/users': [Permission.USERS_VIEW],
  '/admin/settings': [Permission.SYSTEM_SETTINGS],
  '/admin/logs': [Permission.SYSTEM_LOGS],
  '/admin/metrics': [Permission.SYSTEM_METRICS],
};

function getAppMetadataRoles(user: unknown): string[] {
  if (!user || typeof user !== 'object' || !('app_metadata' in user)) {
    return [];
  }

  const appMetadata = (user as { app_metadata?: unknown }).app_metadata;
  if (!appMetadata || typeof appMetadata !== 'object') {
    return [];
  }

  const roles = (appMetadata as { roles?: unknown }).roles;
  return Array.isArray(roles)
    ? roles.filter((role): role is string => typeof role === 'string')
    : [];
}

function isRole(value: string): value is Role {
  return Object.values(Role).includes(value as Role);
}

export class RBACService {
  static getUserRoles(user: unknown): Role[] {
    const validRoles = getAppMetadataRoles(user).filter(isRole);

    // Least privilege: never elevate unknown/unscoped users to admin.
    if (validRoles.length === 0) {
      return [Role.VIEWER];
    }

    return validRoles;
  }

  static getUserPermissions(user: unknown): Permission[] {
    const roles = this.getUserRoles(user);
    const permissions = new Set<Permission>();

    roles.forEach((role) => {
      (ROLE_PERMISSIONS[role] ?? []).forEach((permission) => {
        permissions.add(permission);
      });
    });

    return Array.from(permissions);
  }

  static hasPermission(user: unknown, permission: Permission): boolean {
    return this.getUserPermissions(user).includes(permission);
  }

  static hasRole(user: unknown, role: Role): boolean {
    return this.getUserRoles(user).includes(role);
  }

  static isDemoUser(user: unknown): boolean {
    return this.hasRole(user, Role.DEMO);
  }

  static canAccessRoute(user: unknown, route: string): boolean {
    const requiredPermissions = ROUTE_PERMISSIONS[route] ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    return requiredPermissions.some((permission) =>
      this.hasPermission(user, permission)
    );
  }
}
