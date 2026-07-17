import { Permission, Role, RBACService } from '@/lib/auth/rbac';

describe('RBACService', () => {
  const adminUser = {
    app_metadata: { roles: [Role.ADMIN] },
  };

  const viewerUser = {
    app_metadata: { roles: [Role.VIEWER] },
  };

  const superAdminUser = {
    app_metadata: { roles: [Role.SUPER_ADMIN] },
  };

  it('defaults users without roles to viewer (least privilege)', () => {
    expect(RBACService.getUserRoles({})).toEqual([Role.VIEWER]);
  });

  it('grants demo users view/create/export without admin powers', () => {
    const demoUser = { app_metadata: { roles: [Role.DEMO] } };
    expect(RBACService.hasPermission(demoUser, Permission.LEADS_VIEW)).toBe(
      true
    );
    expect(RBACService.hasPermission(demoUser, Permission.LEADS_CREATE)).toBe(
      true
    );
    expect(RBACService.hasPermission(demoUser, Permission.LEADS_DELETE)).toBe(
      false
    );
    expect(
      RBACService.hasPermission(demoUser, Permission.SYSTEM_SETTINGS)
    ).toBe(false);
    expect(RBACService.isDemoUser(demoUser)).toBe(true);
  });

  it('grants free users full personal CRM without system settings', () => {
    const freeUser = { app_metadata: { roles: [Role.USER] } };
    expect(RBACService.hasPermission(freeUser, Permission.LEADS_DELETE)).toBe(
      true
    );
    expect(
      RBACService.hasPermission(freeUser, Permission.SYSTEM_SETTINGS)
    ).toBe(false);
  });

  it('returns role-specific permissions', () => {
    expect(RBACService.hasPermission(viewerUser, Permission.LEADS_VIEW)).toBe(
      true
    );
    expect(RBACService.hasPermission(viewerUser, Permission.LEADS_DELETE)).toBe(
      false
    );
    expect(RBACService.hasPermission(adminUser, Permission.LEADS_DELETE)).toBe(
      true
    );
  });

  it('grants super admin all permissions', () => {
    expect(
      RBACService.hasPermission(superAdminUser, Permission.SYSTEM_METRICS)
    ).toBe(true);
    expect(
      RBACService.getUserPermissions(superAdminUser).length
    ).toBeGreaterThan(
      RBACService.getUserPermissions(adminUser).length
    );
  });

  it('checks roles correctly', () => {
    expect(RBACService.hasRole(adminUser, Role.ADMIN)).toBe(true);
    expect(RBACService.hasRole(viewerUser, Role.ADMIN)).toBe(false);
  });

  it('enforces route-level permissions', () => {
    expect(RBACService.canAccessRoute(viewerUser, '/dashboard')).toBe(true);
    expect(RBACService.canAccessRoute(viewerUser, '/admin/settings')).toBe(
      false
    );
    expect(RBACService.canAccessRoute(adminUser, '/admin/settings')).toBe(true);
  });

  it('allows unknown routes by default', () => {
    expect(RBACService.canAccessRoute(viewerUser, '/unknown')).toBe(true);
  });
});
