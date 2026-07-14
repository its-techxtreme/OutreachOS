/**
 * @jest-environment node
 */
import { getSupabaseClient } from '@/lib/supabase-client';
import { getSupabaseServer } from '@/lib/supabase-server';

jest.unmock('@/lib/supabase-client');

describe('supabase clients', () => {
  it('creates a browser-safe client with the anon key', () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it('creates a server client with the service role key', () => {
    const client = getSupabaseServer();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it('reuses singleton client instances', () => {
    expect(getSupabaseClient()).toBe(getSupabaseClient());
    expect(getSupabaseServer()).toBe(getSupabaseServer());
  });

  it('throws when public Supabase environment variables are missing', async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    jest.resetModules();
    const { getSupabaseClient: isolatedGetClient } = await import('@/lib/supabase-client');
    expect(() => isolatedGetClient()).toThrow(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  });
});
