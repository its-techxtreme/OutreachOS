import {
  normalizeUsername,
  parseUsername,
  parseUsernameForLookup,
  userNeedsUsername,
} from '@/lib/validation/username-schema';

describe('username-schema', () => {
  it('normalizes and accepts valid usernames', () => {
    expect(parseUsername('  SketchPad_1 ')).toEqual({
      ok: true,
      username: 'sketchpad_1',
    });
    expect(normalizeUsername('TechX')).toBe('techx');
  });

  it('rejects reserved, short, and invalid formats', () => {
    expect(parseUsername('ab').ok).toBe(false);
    expect(parseUsername('admin').ok).toBe(false);
    expect(parseUsername('1bad').ok).toBe(false);
    expect(parseUsername('bad__name').ok).toBe(false);
  });

  it('allows reserved names for login lookup only', () => {
    expect(parseUsernameForLookup('demo_vault')).toEqual({
      ok: true,
      username: 'demo_vault',
    });
    expect(parseUsernameForLookup('admin').ok).toBe(true);
  });

  it('detects when a user still needs a username', () => {
    expect(
      userNeedsUsername({
        user_metadata: {},
        app_metadata: { roles: ['user'] },
      })
    ).toBe(true);
    expect(
      userNeedsUsername({
        user_metadata: { username: 'rio' },
        app_metadata: { roles: ['user'] },
      })
    ).toBe(false);
    expect(
      userNeedsUsername({
        user_metadata: {},
        app_metadata: { roles: ['demo'] },
      })
    ).toBe(false);
  });
});
