/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';

import { Permission, Role } from '@/lib/auth/rbac';
import { useRBAC } from '@/lib/hooks/useRBAC';

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      email: 'admin@test.com',
      app_metadata: { roles: ['admin'] },
    },
  }),
}));

describe('useRBAC', () => {
  it('exposes permission and role helpers', () => {
    const { result } = renderHook(() => useRBAC());

    expect(result.current.hasRole(Role.ADMIN)).toBe(true);
    expect(result.current.hasPermission(Permission.LEADS_VIEW)).toBe(true);
    expect(result.current.canAccessRoute('/dashboard')).toBe(true);
    expect(result.current.roles).toContain(Role.ADMIN);
  });
});
