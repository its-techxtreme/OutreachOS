#!/usr/bin/env node
/**
 * One-time merge: link Google identity into the canonical email+password user,
 * then delete the empty Google-only duplicate (same email).
 *
 * Usage:
 *   node --env-file=.env.local scripts/merge-auth-identities.mjs --dry-run
 *   node --env-file=.env.local scripts/merge-auth-identities.mjs --email=you@example.com
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Never logs secrets. Prefer enabling Supabase Automatic Linking going forward.
 */

import { createClient } from '@supabase/supabase-js';

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (hit) return hit.slice(prefix.length);
  if (process.argv.includes(`--${name}`)) return true;
  return null;
}

const dryRun = Boolean(arg('dry-run'));
const emailFilter = (arg('email') || process.env.ADMIN_EMAIL || '')
  .toString()
  .trim()
  .toLowerCase();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!emailFilter) {
  console.error('Pass --email=... or set ADMIN_EMAIL');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function providersOf(user) {
  const fromMeta = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : user.app_metadata?.provider
      ? [user.app_metadata.provider]
      : [];
  const fromIdentities = (user.identities ?? []).map((i) => i.provider);
  return Array.from(new Set([...fromMeta, ...fromIdentities].filter(Boolean)));
}

async function main() {
  console.log(
    dryRun
      ? `[dry-run] Scanning auth users for ${emailFilter}`
      : `Merging identities for ${emailFilter}`
  );

  const matches = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const batch = data.users ?? [];
    for (const user of batch) {
      if ((user.email ?? '').toLowerCase() === emailFilter) {
        matches.push(user);
      }
    }
    if (batch.length < 200) break;
    page += 1;
  }

  if (matches.length === 0) {
    console.log('No users found for that email.');
    return;
  }

  console.log(`Found ${matches.length} auth user(s) with that email.`);

  const withEmail = matches.filter((u) => providersOf(u).includes('email'));
  const googleOnly = matches.filter((u) => {
    const p = providersOf(u);
    return p.includes('google') && !p.includes('email');
  });

  const canonical =
    withEmail[0] ??
    matches.find((u) => providersOf(u).includes('email')) ??
    matches[0];
  const duplicate = googleOnly.find((u) => u.id !== canonical.id);

  console.log('Canonical:', {
    id: canonical.id,
    providers: providersOf(canonical),
  });
  if (!duplicate) {
    console.log(
      'No Google-only duplicate found. If Google is already linked on canonical, you are done.'
    );
    console.log(
      'Next: enable Automatic Linking in Supabase Auth settings for future sign-ins.'
    );
    return;
  }

  console.log('Duplicate (Google-only):', {
    id: duplicate.id,
    providers: providersOf(duplicate),
  });

  const { count: leadCount } = await admin
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', duplicate.id);

  console.log(`Duplicate lead count: ${leadCount ?? 0}`);

  if (dryRun) {
    console.log(
      '[dry-run] Would move leads to canonical, then delete duplicate user.'
    );
    return;
  }

  if ((leadCount ?? 0) > 0) {
    const { error: moveError } = await admin
      .from('leads')
      .update({ owner_id: canonical.id })
      .eq('owner_id', duplicate.id);
    if (moveError) throw moveError;
    console.log('Moved leads to canonical user.');
  }

  const { error: subMoveError } = await admin
    .from('subscriptions')
    .update({ user_id: canonical.id })
    .eq('user_id', duplicate.id);
  if (subMoveError && !String(subMoveError.message).includes('does not exist')) {
    // Unique on user_id may conflict — prefer keeping canonical row.
    console.warn('Subscription move note:', subMoveError.message);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    duplicate.id
  );
  if (deleteError) throw deleteError;

  console.log(
    'Deleted Google-only duplicate. Link Google on the canonical account via Settings → Link Google, or sign in with Google after enabling Automatic Linking.'
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
