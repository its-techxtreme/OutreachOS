import {
  ACCOUNT_DISABLED_CODE,
  disabledAccountPath,
  getAccountDisableState,
} from '@/lib/auth/account-status';

describe('account disable helpers', () => {
  it('reads disabled state from app_metadata', () => {
    const state = getAccountDisableState({
      app_metadata: {
        account_disabled: true,
        account_disabled_reason: 'Spam abuse',
        account_disabled_at: '2026-07-23T00:00:00.000Z',
      },
    } as never);

    expect(state.disabled).toBe(true);
    expect(state.reason).toBe('Spam abuse');
    expect(state.disabledAt).toBe('2026-07-23T00:00:00.000Z');
  });

  it('treats missing flag as active', () => {
    expect(getAccountDisableState({ app_metadata: {} } as never).disabled).toBe(
      false
    );
    expect(getAccountDisableState(null).disabled).toBe(false);
  });

  it('builds disabled notice path with reason', () => {
    expect(disabledAccountPath('Too many complaints')).toBe(
      '/auth/disabled?reason=Too+many+complaints'
    );
    expect(disabledAccountPath(null)).toBe('/auth/disabled');
    expect(ACCOUNT_DISABLED_CODE).toBe('ACCOUNT_DISABLED');
  });
});
