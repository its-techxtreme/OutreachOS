import { Role } from '@/lib/auth/rbac';
import {
  FREE_MAX_IMPORT_ROWS,
  FREE_MAX_STORED_LEADS,
  PREMIUM_MAX_IMPORT_ROWS_PER_FILE,
  isUnlimitedLeadStorage,
  maxImportRowsForRoles,
  maxStoredLeadsForRoles,
} from '@/lib/quotas';

describe('quotas', () => {
  it('gives free users 500 stored leads and 200 import rows', () => {
    expect(maxStoredLeadsForRoles([Role.USER])).toBe(FREE_MAX_STORED_LEADS);
    expect(maxImportRowsForRoles([Role.USER])).toBe(FREE_MAX_IMPORT_ROWS);
  });

  it('leaves admin storage unlimited', () => {
    expect(maxStoredLeadsForRoles([Role.ADMIN])).toBe(
      Number.POSITIVE_INFINITY
    );
  });

  it('gives premium unlimited storage and 3000 rows per file', () => {
    expect(maxStoredLeadsForRoles([Role.PREMIUM])).toBe(
      Number.POSITIVE_INFINITY
    );
    expect(maxImportRowsForRoles([Role.PREMIUM])).toBe(
      PREMIUM_MAX_IMPORT_ROWS_PER_FILE
    );
    expect(isUnlimitedLeadStorage([Role.PREMIUM])).toBe(true);
  });

  it('caps demo imports at 50 rows', () => {
    expect(maxImportRowsForRoles([Role.DEMO])).toBe(50);
  });
});
