/**
 * @jest-environment node
 */

jest.mock('@/lib/auth/require-session', () => ({
  getServerAuthUser: jest.fn(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}));

jest.mock('@/lib/auth/ensure-role', () => ({
  ensureDefaultUserRole: jest.fn(async (user: unknown) => user),
}));

jest.mock('@/lib/auth/rbac', () => ({
  RBACService: {
    isDemoUser: jest.fn(() => false),
  },
}));

jest.mock('@/lib/demo/sample-leads', () => ({
  getDemoSampleLeadIds: jest.fn(async () => []),
}));

jest.mock('@/lib/quests/progress', () => ({
  applyStatusQuestProgress: jest.fn(async () => undefined),
}));

import { getClientIp } from '@/lib/api-helpers';

jest.mock('@/lib/rate-limiter', () => ({
  rateLimiters: {
    dialKit: { check: jest.fn(async () => undefined) },
  },
}));

jest.mock('@/lib/leads/user-lead-status', () => ({
  upsertUserLeadStatus: jest.fn(async () => undefined),
}));

const maybeSingle = jest.fn();
const single = jest.fn();
const updateEq = jest.fn(() => ({ select: () => ({ single }) }));
const update = jest.fn(() => ({ eq: updateEq }));
const selectEq = jest.fn(() => ({ maybeSingle }));
const select = jest.fn(() => ({ eq: selectEq }));

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: () => ({
    from: () => ({
      select,
      update,
    }),
  }),
}));

import { PATCH } from '@/app/api/leads/[id]/route';
import { getServerAuthUser } from '@/lib/auth/require-session';
import { applyStatusQuestProgress } from '@/lib/quests/progress';

describe('PATCH /api/leads/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      app_metadata: { roles: ['user'] },
    });
  });

  it('updates status for owned lead', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 9, status: 'New', owner_id: 'user-1' },
      error: null,
    });
    single.mockResolvedValue({
      data: {
        id: 9,
        status: 'Called',
        owner_id: 'user-1',
        name: 'Acme',
      },
      error: null,
    });

    const response = await PATCH(
      new Request('http://localhost/api/leads/9', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Called' }),
      }),
      { params: Promise.resolve({ id: '9' }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.lead.status).toBe('Called');
    expect(applyStatusQuestProgress).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'Called'
    );
  });

  it('rejects invalid status', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/leads/9', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Contacted' }),
      }),
      { params: Promise.resolve({ id: '9' }) }
    );
    expect(response.status).toBe(400);
  });
});
