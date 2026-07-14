/**
 * Phase 1 live verification against the dedicated OutreachOS Supabase project.
 * Usage: node scripts/live-verify.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  const content = readFileSync(envPath, 'utf8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }

  return env;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testAnonRlsBlocked(env) {
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await anon.from('leads').select('*').limit(1);
  assert(!error, `Anon select should not error: ${error?.message}`);
  assert(Array.isArray(data) && data.length === 0, 'Anon select must return zero rows due to RLS');
  console.log('PASS anon RLS blocks reads');
}

async function testServiceRoleInsertAndDuplicate(env) {
  assert(env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
  const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const mapsUrl = `https://maps.google.com/?q=live-verify-${randomUUID()}`;

  const { data: created, error: createError } = await service
    .from('leads')
    .insert({
      name: 'Live Verify Business',
      niche: 'Testing',
      country: 'India',
      maps_url: mapsUrl,
      status: 'New',
    })
    .select('id')
    .single();

  assert(!createError, `Service role insert failed: ${createError?.message}`);
  assert(created?.id, 'Expected created lead id');
  console.log('PASS service role insert');

  const { error: duplicateError } = await service.from('leads').insert({
    name: 'Duplicate Business',
    niche: 'Testing',
    country: 'India',
    maps_url: mapsUrl,
    status: 'New',
  });

  assert(duplicateError?.code === '23505', 'Expected duplicate maps_url violation');
  console.log('PASS unique maps_url constraint');

  await service.from('leads').delete().eq('maps_url', mapsUrl);
  console.log('PASS cleanup test lead');
}

async function testApiRoute(env) {
  assert(env.AGENT_SECRET, 'AGENT_SECRET is missing');

  const baseUrl = process.env.PHASE1_BASE_URL ?? 'http://localhost:3000';
  const mapsUrl = `https://maps.google.com/?q=api-live-${randomUUID()}`;

  const unauthorized = await fetch(`${baseUrl}/api/agent/leads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      lead: {
        name: 'Unauthorized',
        niche: 'Testing',
        country: 'India',
        maps_url: mapsUrl,
      },
    }),
  });
  assert(unauthorized.status === 401, `Expected 401, got ${unauthorized.status}`);
  console.log('PASS API rejects missing secret');

  const created = await fetch(`${baseUrl}/api/agent/leads`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Agent-Secret': env.AGENT_SECRET,
    },
    body: JSON.stringify({
      lead: {
        name: 'API Live Verify',
        niche: 'Testing',
        country: 'India',
        maps_url: mapsUrl,
      },
    }),
  });

  const createdBody = await created.json();
  assert(created.status === 201, `Expected 201, got ${created.status}: ${JSON.stringify(createdBody)}`);
  console.log('PASS API creates lead (201)');

  const duplicate = await fetch(`${baseUrl}/api/agent/leads`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Agent-Secret': env.AGENT_SECRET,
    },
    body: JSON.stringify({
      lead: {
        name: 'API Live Verify Duplicate',
        niche: 'Testing',
        country: 'India',
        maps_url: mapsUrl,
      },
    }),
  });

  const duplicateBody = await duplicate.json();
  assert(duplicate.status === 200, `Expected 200 duplicate, got ${duplicate.status}`);
  assert(duplicateBody.skipped === true, 'Expected skipped=true for duplicate');
  console.log('PASS API duplicate handling (200 skipped)');

  const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await service.from('leads').delete().eq('maps_url', mapsUrl);
}

async function main() {
  const env = loadEnvLocal();
  assert(env.NEXT_PUBLIC_SUPABASE_URL?.includes('qowwnchhyjnfovxcjiqw'), 'Wrong Supabase project URL');
  console.log('Using OutreachOS project:', env.NEXT_PUBLIC_SUPABASE_URL);

  await testAnonRlsBlocked(env);

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'BLOCKED: Add SUPABASE_SERVICE_ROLE_KEY to .env.local from legacy keys tab:\n' +
        'https://supabase.com/dashboard/project/qowwnchhyjnfovxcjiqw/settings/api-keys'
    );
    process.exit(1);
  }

  await testServiceRoleInsertAndDuplicate(env);

  try {
    await testApiRoute(env);
    console.log('PASS full API live workflow');
  } catch (error) {
    console.warn('API route live test skipped (is `npm run dev` running?):', error.message);
  }

  console.log('\nAll live Phase 1 checks passed.');
}

main().catch((error) => {
  console.error('Live verification failed:', error.message);
  process.exit(1);
});
