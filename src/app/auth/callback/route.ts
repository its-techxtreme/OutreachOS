import { NextResponse } from 'next/server';

import { ensureDefaultUserRole } from '@/lib/auth/ensure-role';
import {
  disabledAccountPath,
  getAccountDisableState,
} from '@/lib/auth/account-status';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { userNeedsUsername } from '@/lib/validation/username-schema';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data.user) {
        const disable = getAccountDisableState(data.user);
        if (disable.disabled) {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            new URL(disabledAccountPath(disable.reason), origin)
          );
        }

        await ensureDefaultUserRole(data.user);
        const destination = userNeedsUsername(data.user)
          ? '/auth/username'
          : next;
        return NextResponse.redirect(new URL(destination, origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL('/auth/login?error=auth_callback', origin)
  );
}
