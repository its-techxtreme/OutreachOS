/**
 * Ensures admin + demo auth users exist (idempotent).
 * Reads credentials from .env.local — never commit that file.
 *
 * Usage: node scripts/ensure-accounts.mjs
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

function normalizeProfileUsername(username, userId) {
  const normalized = String(username)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^[^a-z]+/, 'u');

  if (normalized.length >= 3) {
    return normalized.slice(0, 20);
  }

  return `user${String(userId).replace(/-/g, '').slice(0, 8)}`;
}

async function ensureProfile(admin, { userId, username }) {
  if (!userId || !username) {
    return { ok: false, skipped: true };
  }

  const safeUsername = normalizeProfileUsername(username, userId);

  const { error } = await admin.from('profiles').upsert(
    {
      user_id: userId,
      username: safeUsername,
      display_name: safeUsername,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw new Error(
      `PROFILE_UPSERT_FAILED (${safeUsername}): ${error.message}`
    );
  }

  return { ok: true, username: safeUsername };
}

async function ensureUser(admin, { email, password, username, roles, name }) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) {
    throw new Error(`LIST_FAILED: ${listed.error.message}`);
  }

  const existing = listed.data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  const profileUsername = normalizeProfileUsername(
    username,
    existing?.id ?? 'pending'
  );

  const app_metadata = {
    ...(existing?.app_metadata ?? {}),
    roles,
  };
  const user_metadata = {
    ...(existing?.user_metadata ?? {}),
    username: profileUsername,
    name,
  };

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata,
      user_metadata,
    });

    if (error) {
      throw new Error(`UPDATE_FAILED (${email}): ${error.message}`);
    }

    await ensureProfile(admin, {
      userId: data.user.id,
      username: profileUsername,
    });

    return {
      ok: true,
      action: 'updated',
      userId: data.user.id,
      email: data.user.email,
      username: profileUsername,
      roles: data.user.app_metadata?.roles,
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata,
    user_metadata,
  });

  if (error) {
    throw new Error(`CREATE_FAILED (${email}): ${error.message}`);
  }

  const createdUsername = normalizeProfileUsername(
    username,
    data.user?.id ?? 'pending'
  );

  if (createdUsername !== profileUsername && data.user?.id) {
    await admin.auth.admin.updateUserById(data.user.id, {
      user_metadata: {
        ...user_metadata,
        username: createdUsername,
      },
    });
  }

  await ensureProfile(admin, {
    userId: data.user?.id,
    username: createdUsername,
  });

  return {
    ok: true,
    action: 'created',
    userId: data.user?.id,
    email: data.user?.email,
    username: createdUsername,
    roles: data.user?.app_metadata?.roles,
  };
}

async function main() {
  const env = {
    ...loadEnv(path.join(process.cwd(), '.env')),
    ...loadEnv(path.join(process.cwd(), '.env.local')),
  };

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      'Missing required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results = [];

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    results.push(
      await ensureUser(admin, {
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        username: env.ADMIN_USERNAME || 'admin_ops',
        roles: ['admin'],
        name: 'OutreachOS Admin',
      })
    );
  } else {
    console.warn('Skipping admin — ADMIN_EMAIL / ADMIN_PASSWORD not set');
  }

  if (env.DEMO_USER_EMAIL && env.DEMO_USER_PASSWORD) {
    results.push(
      await ensureUser(admin, {
        email: env.DEMO_USER_EMAIL,
        password: env.DEMO_USER_PASSWORD,
        username: env.DEMO_USER_USERNAME || 'demo_vault',
        roles: ['demo'],
        name: 'OutreachOS Demo',
      })
    );
  } else {
    console.warn(
      'Skipping demo — DEMO_USER_EMAIL / DEMO_USER_PASSWORD not set'
    );
  }

  console.log(JSON.stringify({ ok: true, users: results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
