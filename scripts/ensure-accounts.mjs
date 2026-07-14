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

async function ensureUser(admin, { email, password, username, roles, name }) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) {
    throw new Error(`LIST_FAILED: ${listed.error.message}`);
  }

  const existing = listed.data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  const app_metadata = {
    ...(existing?.app_metadata ?? {}),
    roles,
  };
  const user_metadata = {
    ...(existing?.user_metadata ?? {}),
    username,
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

    return {
      ok: true,
      action: 'updated',
      userId: data.user.id,
      email: data.user.email,
      username,
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

  return {
    ok: true,
    action: 'created',
    userId: data.user?.id,
    email: data.user?.email,
    username,
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
        username: env.ADMIN_USERNAME || 'Admin',
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
        username: env.DEMO_USER_USERNAME || 'DemoUser',
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
