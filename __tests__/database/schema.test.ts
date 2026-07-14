import fs from 'fs';
import path from 'path';

describe('database schema migration', () => {
  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '001_create_leads_table.sql'
  );
  let migrationSql: string;

  beforeAll(() => {
    migrationSql = fs.readFileSync(migrationPath, 'utf8');
  });

  it('defines the leads table with required columns', () => {
    expect(migrationSql).toMatch(/CREATE TABLE IF NOT EXISTS leads/i);
    expect(migrationSql).toMatch(/name TEXT NOT NULL/);
    expect(migrationSql).toMatch(/maps_url TEXT NOT NULL/);
    expect(migrationSql).toMatch(/updated_at TIMESTAMP WITH TIME ZONE/);
  });

  it('defines required constraints', () => {
    expect(migrationSql).toMatch(/CONSTRAINT unique_maps_url UNIQUE \(maps_url\)/);
    expect(migrationSql).toMatch(/CONSTRAINT valid_status CHECK/);
  });

  it('creates required performance indexes', () => {
    expect(migrationSql).toMatch(/idx_leads_niche/);
    expect(migrationSql).toMatch(/idx_leads_name_gin/);
    expect(migrationSql).toMatch(/idx_leads_niche_country/);
  });

  it('enables pg_trgm for fuzzy search', () => {
    expect(migrationSql).toMatch(/CREATE EXTENSION IF NOT EXISTS pg_trgm/);
  });

  it('enables row level security and policies', () => {
    expect(migrationSql).toMatch(/ALTER TABLE leads ENABLE ROW LEVEL SECURITY/);
    expect(migrationSql).toMatch(/"Admin full access"/);
    expect(migrationSql).toMatch(/"Service role access"/);
    expect(migrationSql).toMatch(/"Deny anonymous access"/);
  });
});

const hasLiveDatabase =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('test.supabase.co');

const describeLiveDatabase = hasLiveDatabase ? describe : describe.skip;

describeLiveDatabase('live database schema verification', () => {
  it('denies anonymous access through RLS policies', async () => {
    const { testRLSPolicies } = await import('../utils/supabase-test-utils');
    const { data, error } = await testRLSPolicies();
    expect(data).toEqual([]);
    expect(error).toBeNull();
  });
});
