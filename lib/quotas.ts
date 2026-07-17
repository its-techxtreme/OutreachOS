import { Role } from '@/lib/auth/rbac';

/** Free-tier / demo / admin quotas for personal lead pools. */
export const FREE_MAX_STORED_LEADS = 500;
export const FREE_MAX_IMPORT_ROWS = 200;
export const FREE_IMPORTS_PER_DAY = 10;

export const DEMO_MAX_STORED_LEADS = 100;
export const DEMO_MAX_IMPORT_ROWS = 50;

/** Admin / manager: effectively unlimited stored leads. */
export const ADMIN_MAX_STORED_LEADS = Number.POSITIVE_INFINITY;
export const ADMIN_MAX_IMPORT_ROWS = 2_000;

export function maxStoredLeadsForRoles(roles: Role[]): number {
  if (
    roles.includes(Role.ADMIN) ||
    roles.includes(Role.SUPER_ADMIN) ||
    roles.includes(Role.MANAGER)
  ) {
    return ADMIN_MAX_STORED_LEADS;
  }
  if (roles.includes(Role.DEMO)) {
    return DEMO_MAX_STORED_LEADS;
  }
  return FREE_MAX_STORED_LEADS;
}

export function maxImportRowsForRoles(roles: Role[]): number {
  if (
    roles.includes(Role.ADMIN) ||
    roles.includes(Role.SUPER_ADMIN) ||
    roles.includes(Role.MANAGER)
  ) {
    return ADMIN_MAX_IMPORT_ROWS;
  }
  if (roles.includes(Role.DEMO)) {
    return DEMO_MAX_IMPORT_ROWS;
  }
  return FREE_MAX_IMPORT_ROWS;
}

export function isUnlimitedLeadStorage(roles: Role[]): boolean {
  return !Number.isFinite(maxStoredLeadsForRoles(roles));
}
