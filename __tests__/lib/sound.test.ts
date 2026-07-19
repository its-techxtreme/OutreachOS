/**
 * @jest-environment jsdom
 */
import { isSoundMuted, playSound, setSoundMuted, SOUND_MUTE_KEY } from '@/lib/sound';

describe('sound', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('respects mute flag', () => {
    setSoundMuted(true);
    expect(window.localStorage.getItem(SOUND_MUTE_KEY)).toBe('1');
    expect(isSoundMuted()).toBe(true);
    expect(() => playSound('tap')).not.toThrow();
  });

  it('can unmute', () => {
    setSoundMuted(false);
    expect(window.localStorage.getItem(SOUND_MUTE_KEY)).toBe('0');
  });
});
