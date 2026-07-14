/**
 * @jest-environment node
 */
import { createServerSupabaseClient } from '@/lib/supabase/server';

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    getAll: () => [],
    set: jest.fn(),
  })),
}));

describe('createServerSupabaseClient', () => {
  it('creates a server client with cookie adapters', async () => {
    const client = await createServerSupabaseClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });
});
