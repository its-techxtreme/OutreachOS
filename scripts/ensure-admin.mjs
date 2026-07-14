/**
 * Ensures the local admin user exists (idempotent).
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD / Supabase keys from .env.local
 *
 * Usage: node scripts/ensure-admin.mjs
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

async function main() {
  const env = {
    ...loadEnv(path.join(process.cwd(), '.env')),
    ...loadEnv(path.join(process.cwd(), '.env.local')),
  };

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;

  if (!url || !serviceKey || !email || !password) {
    console.error(
      'Missing required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD'
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listed.error) {
    console.error('LIST_FAILED', listed.error.message);
    process.exit(1);
  }

  const existing = listed.data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: {
        ...existing.app_metadata,
        roles: ['admin'],
      },
    });

    if (error) {
      console.error('UPDATE_FAILED', error.message);
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          action: 'updated',
          userId: data.user.id,
          email: data.user.email,
          roles: data.user.app_metadata?.roles,
        },
        null,
        2
      )
    );
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { roles: ['admin'] },
    user_metadata: { name: 'OutreachOS Admin' },
  });

  if (error) {
    console.error('CREATE_FAILED', error.message);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: 'created',
        userId: data.user?.id,
        email: data.user?.email,
        roles: data.user?.app_metadata?.roles,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
