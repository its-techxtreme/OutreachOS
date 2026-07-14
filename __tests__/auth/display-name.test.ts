import { getUserDisplayName } from '@/lib/auth/display-name';
import type { User } from '@supabase/supabase-js';

function asUser(partial: Partial<User>): User {
  return partial as User;
}

describe('getUserDisplayName', () => {
  it('prefers username over email', () => {
    expect(
      getUserDisplayName(
        asUser({
          email: 'secret@example.com',
          user_metadata: { username: 'TechxBro' },
        })
      )
    ).toBe('TechxBro');
  });

  it('falls back to name then local-part', () => {
    expect(
      getUserDisplayName(
        asUser({
          email: 'demo@example.com',
          user_metadata: { name: 'OutreachOS Demo' },
        })
      )
    ).toBe('OutreachOS Demo');

    expect(
      getUserDisplayName(
        asUser({
          email: 'demo@example.com',
          user_metadata: {},
        })
      )
    ).toBe('demo');
  });
});
