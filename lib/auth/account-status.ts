import type { User } from '@supabase/supabase-js';

export const ACCOUNT_DISABLED_CODE = 'ACCOUNT_DISABLED' as const;

export type AccountDisableState = {
  disabled: boolean;
  reason: string | null;
  disabledAt: string | null;
};

export function getAccountDisableState(
  user: User | null | undefined
): AccountDisableState {
  const meta = user?.app_metadata as Record<string, unknown> | undefined;
  const disabled = meta?.account_disabled === true;
  const reason =
    typeof meta?.account_disabled_reason === 'string'
      ? meta.account_disabled_reason.trim()
      : null;
  const disabledAt =
    typeof meta?.account_disabled_at === 'string'
      ? meta.account_disabled_at
      : null;

  return {
    disabled,
    reason: reason && reason.length > 0 ? reason : null,
    disabledAt,
  };
}

export function disabledAccountPath(reason: string | null): string {
  const params = new URLSearchParams();
  if (reason) {
    params.set('reason', reason.slice(0, 500));
  }
  const qs = params.toString();
  return qs ? `/auth/disabled?${qs}` : '/auth/disabled';
}
