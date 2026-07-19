/**
 * Soft UI sound effects via Web Audio API (no asset files).
 * Respects prefers-reduced-motion / user mute flag in localStorage.
 */

export const SOUND_MUTE_KEY = 'outreachos_sound_muted';

type SoundKind =
  | 'tap'
  | 'success'
  | 'whoosh'
  | 'pop'
  | 'soft'
  | 'spotlight'
  | 'checkpoint'
  | 'fanfare';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) {
        return null;
      }
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    if (window.localStorage.getItem(SOUND_MUTE_KEY) === '1') {
      return true;
    }
  } catch {
    /* ignore */
  }
  try {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function setSoundMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(SOUND_MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function tone(
  frequency: number,
  durationMs: number,
  type: OscillatorType,
  gain = 0.04,
  when = 0
): void {
  const ctx = getContext();
  if (!ctx || isSoundMuted()) {
    return;
  }

  void ctx.resume().catch(() => undefined);

  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  const start = ctx.currentTime + when;
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000 + 0.02);
}

export function playSound(kind: SoundKind): void {
  switch (kind) {
    case 'tap':
      tone(520, 60, 'triangle', 0.03);
      break;
    case 'pop':
      tone(680, 80, 'sine', 0.035);
      tone(920, 50, 'sine', 0.02, 0.04);
      break;
    case 'success':
      tone(440, 90, 'sine', 0.04);
      tone(554, 100, 'sine', 0.035, 0.08);
      tone(659, 140, 'sine', 0.03, 0.16);
      break;
    case 'whoosh':
      tone(220, 180, 'sawtooth', 0.015);
      tone(160, 200, 'triangle', 0.012, 0.05);
      break;
    case 'soft':
      tone(380, 70, 'sine', 0.025);
      break;
    case 'spotlight':
      tone(330, 90, 'triangle', 0.028);
      tone(440, 110, 'sine', 0.022, 0.07);
      break;
    case 'checkpoint':
      // Rising “ding-ding-DING” confirmation
      tone(523, 90, 'sine', 0.05);
      tone(659, 100, 'sine', 0.055, 0.1);
      tone(784, 140, 'triangle', 0.06, 0.2);
      tone(1046, 180, 'sine', 0.045, 0.34);
      break;
    case 'fanfare':
      tone(392, 120, 'triangle', 0.045);
      tone(523, 120, 'sine', 0.05, 0.12);
      tone(659, 140, 'sine', 0.055, 0.24);
      tone(784, 200, 'triangle', 0.05, 0.38);
      tone(1046, 220, 'sine', 0.04, 0.55);
      break;
    default:
      break;
  }
}
