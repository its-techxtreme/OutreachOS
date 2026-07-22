import { Role } from '@/lib/auth/rbac';

/** Free-tier / demo / premium / admin quotas for personal lead pools. */
export const FREE_MAX_STORED_LEADS = 500;
export const FREE_MAX_IMPORT_ROWS = 200;
export const FREE_IMPORTS_PER_DAY = 10;

export const DEMO_MAX_STORED_LEADS = 100;
export const DEMO_MAX_IMPORT_ROWS = 50;

/** Paid Premium — unlimited storage; hourly import budgets. */
export const PREMIUM_MAX_STORED_LEADS = Number.POSITIVE_INFINITY;
/** Max rows allowed in a single Premium upload (also the hourly budget). */
export const PREMIUM_MAX_IMPORT_ROWS_PER_FILE = 3_000;
export const PREMIUM_IMPORT_FILES_PER_HOUR = 30;
export const PREMIUM_IMPORT_ROWS_PER_HOUR = 3_000;

/** Admin / manager: effectively unlimited stored leads. */
export const ADMIN_MAX_STORED_LEADS = Number.POSITIVE_INFINITY;
export const ADMIN_MAX_IMPORT_ROWS = 2_000;

export function maxStoredLeadsForRoles(roles: Role[]): number {
  if (
    roles.includes(Role.ADMIN) ||
    roles.includes(Role.SUPER_ADMIN) ||
    roles.includes(Role.MANAGER) ||
    roles.includes(Role.PREMIUM)
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
  if (roles.includes(Role.PREMIUM)) {
    return PREMIUM_MAX_IMPORT_ROWS_PER_FILE;
  }
  if (roles.includes(Role.DEMO)) {
    return DEMO_MAX_IMPORT_ROWS;
  }
  return FREE_MAX_IMPORT_ROWS;
}

export function isUnlimitedLeadStorage(roles: Role[]): boolean {
  return !Number.isFinite(maxStoredLeadsForRoles(roles));
}

export function isPremiumRole(roles: Role[]): boolean {
  return roles.includes(Role.PREMIUM);
}
