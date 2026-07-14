import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getServerAuthUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireServerAuth(): Promise<User> {
  const user = await getServerAuthUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

export function unauthorizedJsonResponse(requestId?: string) {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      ...(requestId ? { requestId } : {}),
    },
    { status: 401 }
  );
}
