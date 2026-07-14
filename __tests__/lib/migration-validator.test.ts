import {
  ProductionMigrationValidator,
  validateProductionMigration,
} from '@/lib/db/migration-validator';

function mockFrom(tableHandlers: Record<string, () => unknown>) {
  return jest.fn((table: string) => {
    const handler = tableHandlers[table];
    if (!handler) {
      return {
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'missing' } }),
          head: true,
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    return handler();
  });
}

describe('ProductionMigrationValidator', () => {
  it('returns success when tables, RLS, and unique constraint behave correctly', async () => {
    let insertCount = 0;

    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [
          { policyname: 'Admin full access' },
          { policyname: 'Service role access' },
          { policyname: 'Deny anonymous access' },
        ],
        error: null,
      }),
      from: mockFrom({
        leads: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
            single: jest.fn(),
          }),
          insert: jest.fn().mockImplementation(() => {
            insertCount += 1;
            if (insertCount === 1) {
              return Promise.resolve({ error: null });
            }
            return Promise.resolve({
              error: { code: '23505', message: 'duplicate key' },
            });
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
        api_keys: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        audit_logs: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        lead_stats: () => ({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { total_leads: 0, leads_today: 0 },
              error: null,
            }),
          }),
        }),
      }),
    };

    const validator = new ProductionMigrationValidator(client as never);
    const result = await validator.validateMigration();

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.statistics).toMatchObject({ total_leads: 0 });
  });

  it('reports missing tables', async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      from: jest.fn((table: string) => {
        if (table === 'api_keys') {
          return {
            select: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'relation "api_keys" does not exist' },
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            single: jest.fn().mockResolvedValue({
              data: { total_leads: 0 },
              error: null,
            }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }),
    };

    const validator = new ProductionMigrationValidator(client as never);
    const result = await validator.validateMigration();

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('api_keys'))).toBe(true);
  });

  it('reports missing RLS policies', async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [{ policyname: 'Admin full access' }],
        error: null,
      }),
      from: mockFrom({
        leads: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
        api_keys: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        audit_logs: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        lead_stats: () => ({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { total_leads: 0 },
              error: null,
            }),
          }),
        }),
      }),
    };

    const validator = new ProductionMigrationValidator(client as never);
    const result = await validator.validateMigration();

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('Missing RLS policies'))).toBe(
      true
    );
  });

  it('warns when RLS RPC is unavailable', async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'function get_rls_policies does not exist' },
      }),
      from: mockFrom({
        leads: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
          insert: jest.fn().mockResolvedValue({
            error: { message: 'insert failed' },
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
        api_keys: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        audit_logs: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        lead_stats: () => ({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'view missing' },
            }),
          }),
        }),
      }),
    };

    // Override leads select count fallback
    (client.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'leads') {
        return {
          select: jest.fn((cols?: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.count === 'exact') {
              return Promise.resolve({ count: 3, error: null });
            }
            return {
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            };
          }),
          insert: jest.fn().mockResolvedValue({
            error: { message: 'insert failed' },
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'lead_stats') {
        return {
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'view missing' },
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    const validator = new ProductionMigrationValidator(client as never);
    const result = await validator.validateMigration();

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.statistics).toMatchObject({ total_leads: 3 });
  });

  it('flags missing unique constraint when duplicate insert succeeds', async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [
          { policyname: 'Admin full access' },
          { policyname: 'Service role access' },
          { policyname: 'Deny anonymous access' },
        ],
        error: null,
      }),
      from: mockFrom({
        leads: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
        api_keys: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        audit_logs: () => ({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        lead_stats: () => ({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { total_leads: 1 },
              error: null,
            }),
          }),
        }),
      }),
    };

    const validator = new ProductionMigrationValidator(client as never);
    const result = await validator.validateMigration();

    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) => e.includes('unique constraint on maps_url'))
    ).toBe(true);
  });

  it('captures thrown errors during validation', async () => {
    const client = {
      rpc: jest.fn().mockRejectedValue(new Error('network down')),
      from: jest.fn(() => {
        throw new Error('network down');
      }),
    };

    const validator = new ProductionMigrationValidator(client as never);
    const result = await validator.validateMigration();

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Migration validation failed');
  });

  it('validateProductionMigration factory is exported', () => {
    expect(typeof validateProductionMigration).toBe('function');
  });

  it('warns on unexpected duplicate error codes', async () => {
    let insertCount = 0;
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [
          { policyname: 'Admin full access' },
          { policyname: 'Service role access' },
          { policyname: 'Deny anonymous access' },
        ],
        error: null,
      }),
      from: jest.fn((table: string) => {
        if (table === 'leads') {
          return {
            select: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
            insert: jest.fn().mockImplementation(() => {
              insertCount += 1;
              if (insertCount === 1) {
                return Promise.resolve({ error: null });
              }
              return Promise.resolve({
                error: { code: '42000', message: 'weird' },
              });
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'lead_stats') {
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { total_leads: 0 },
                error: null,
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }),
    };

    const validator = new ProductionMigrationValidator(client as never);
    const result = await validator.validateMigration();
    expect(result.warnings.some((w) => w.includes('Unexpected duplicate'))).toBe(
      true
    );
  });
});
