/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';

import { POST } from '@/app/api/leads/import/route';
import { Permission, Role } from '@/lib/auth/rbac';
import { RateLimitError } from '@/lib/errors';

jest.mock('@/lib/auth/require-session', () => ({
  getServerAuthUser: jest.fn(),
  unauthorizedJsonResponse: jest.fn(() =>
    NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ),
}));

jest.mock('@/lib/auth/rbac', () => {
  const actual = jest.requireActual('@/lib/auth/rbac');
  return {
    ...actual,
    RBACService: {
      ...actual.RBACService,
      hasPermission: jest.fn(),
      getUserRoles: jest.fn((user: unknown) =>
        actual.RBACService.getUserRoles(user)
      ),
      isDemoUser: jest.fn((user: unknown) =>
        actual.RBACService.isDemoUser(user)
      ),
    },
  };
});

jest.mock('@/lib/rate-limiter', () => ({
  getImportRateLimiterForUser: jest.fn(() => ({
    check: jest.fn().mockResolvedValue({ success: true }),
  })),
  rateLimiters: {
    leadImport: {
      check: jest.fn().mockResolvedValue({ success: true }),
    },
  },
}));

jest.mock('@/lib/import/excel-parser', () => {
  class ImportFileError extends Error {
    constructor(
      message: string,
      readonly code: string
    ) {
      super(message);
      this.name = 'ImportFileError';
    }
  }

  return {
    assertSafeImportFile: jest.fn(),
    parseExcelBuffer: jest.fn(),
    ImportFileError,
  };
});

jest.mock('@/lib/import/import-leads', () => ({
  importValidatedLeads: jest.fn(),
}));

jest.mock('@/lib/security-logger', () => ({
  SecurityEventType: {
    LEAD_IMPORT: 'LEAD_IMPORT',
    LEAD_IMPORT_DENIED: 'LEAD_IMPORT_DENIED',
    DATA_ACCESS_DENIED: 'DATA_ACCESS_DENIED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
  },
  SecurityLogger: { log: jest.fn() },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { getServerAuthUser } from '@/lib/auth/require-session';
import { RBACService } from '@/lib/auth/rbac';
import {
  assertSafeImportFile,
  parseExcelBuffer,
} from '@/lib/import/excel-parser';
import { importValidatedLeads } from '@/lib/import/import-leads';
import { getImportRateLimiterForUser } from '@/lib/rate-limiter';

function buildRequest(file?: File): Request {
  const form = new FormData();
  if (file) {
    form.append('file', file);
  }

  return {
    headers: new Headers({
      'content-type': 'multipart/form-data; boundary=----outreachos',
      'x-forwarded-for': '127.0.0.1',
    }),
    formData: async () => form,
  } as unknown as Request;
}

describe('POST /api/leads/import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getImportRateLimiterForUser as jest.Mock).mockReturnValue({
      check: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue(null);

    const response = await POST(buildRequest());
    expect(response.status).toBe(401);
  });

  it('returns 403 without LEADS_CREATE', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.VIEWER] },
    });
    (RBACService.hasPermission as jest.Mock).mockReturnValue(false);

    const file = new File([Buffer.from('PK\x03\x04')], 'leads.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const response = await POST(buildRequest(file));
    expect(response.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.ADMIN] },
    });
    (RBACService.hasPermission as jest.Mock).mockImplementation(
      (_user: unknown, permission: Permission) =>
        permission === Permission.LEADS_CREATE
    );
    (getImportRateLimiterForUser as jest.Mock).mockReturnValue({
      check: jest.fn().mockRejectedValue(new RateLimitError(900)),
    });

    const file = new File([Buffer.from('PK\x03\x04')], 'leads.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const response = await POST(buildRequest(file));
    expect(response.status).toBe(429);
  });

  it('imports a valid workbook for authorized users', async () => {
    (getServerAuthUser as jest.Mock).mockResolvedValue({
      id: 'u1',
      app_metadata: { roles: [Role.ADMIN] },
    });
    (RBACService.hasPermission as jest.Mock).mockImplementation(
      (_user: unknown, permission: Permission) =>
        permission === Permission.LEADS_CREATE
    );
    (assertSafeImportFile as jest.Mock).mockReturnValue(undefined);
    (parseExcelBuffer as jest.Mock).mockResolvedValue({
      headers: ['Name'],
      rows: [{ Name: 'Acme' }],
    });
    (importValidatedLeads as jest.Mock).mockResolvedValue({
      totalRows: 1,
      created: 1,
      duplicates: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    });

    const file = new File([Buffer.from('PK\x03\x04fake')], 'leads.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const response = await POST(buildRequest(file));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.summary.created).toBe(1);
    expect(importValidatedLeads).toHaveBeenCalled();
  });
});
