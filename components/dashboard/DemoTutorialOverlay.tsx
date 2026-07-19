'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import Image from 'next/image';
import { Check, MousePointer2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RBACService } from '@/lib/auth/rbac';
import {
  subscribeTutorialAction,
  type TutorialAction,
} from '@/lib/demo/tutorial-bus';
import {
  DEMO_TUTORIAL_STEPS,
  DEMO_TUTORIAL_STORAGE_KEY,
  type PointerSide,
  type TutorialStep,
} from '@/lib/demo/tutorial-steps';
import { useAuth } from '@/lib/hooks/useAuth';
import { MASCOTS } from '@/lib/mascots';
import { playSound } from '@/lib/sound';

type SpotRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const PAD = 10;

function readTargetRect(step: TutorialStep): SpotRect | null {
  if (!step.targetSelector || typeof document === 'undefined') {
    return null;
  }
  const el = document.querySelector(step.targetSelector);
  if (!(el instanceof HTMLElement)) {
    return null;
  }
  try {
    el.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: 'smooth',
    });
  } catch {
    /* jsdom may not implement scrollIntoView */
  }
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    return null;
  }

  let width = rect.width + PAD * 2;
  let height = rect.height + PAD * 2;
  let left = rect.left - PAD;
  let top = rect.top - PAD;

  if (step.maxSpotWidth && width > step.maxSpotWidth) {
    left += (width - step.maxSpotWidth) / 2;
    width = step.maxSpotWidth;
  }
  if (step.maxSpotHeight && height > step.maxSpotHeight) {
    top += (height - step.maxSpotHeight) / 2;
    height = step.maxSpotHeight;
  }

  return {
    top: Math.max(4, top),
    left: Math.max(4, left),
    width,
    height,
  };
}

function pointerStyle(spot: SpotRect, side: PointerSide): CSSProperties {
  const cx = spot.left + spot.width / 2;
  const cy = spot.top + spot.height / 2;
  switch (side) {
    case 'top':
      return {
        top: spot.top - 52,
        left: cx - 22,
      };
    case 'left':
      return {
        top: cy - 22,
        left: spot.left - 56,
      };
    case 'right':
      return {
        top: cy - 22,
        left: spot.left + spot.width + 12,
      };
    case 'bottom':
    default:
      return {
        top: spot.top + spot.height + 8,
        left: cx - 22,
      };
  }
}

function coachPlacement(spot: SpotRect | null): CSSProperties {
  if (!spot || typeof window === 'undefined') {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const panelW = Math.min(window.innerWidth - 24, 380);
  const preferBelow = spot.top + spot.height < window.innerHeight * 0.48;
  let left = Math.min(
    Math.max(12, spot.left + spot.width / 2 - panelW / 2),
    window.innerWidth - panelW - 12
  );

  if (preferBelow) {
    return {
      left,
      top: Math.min(window.innerHeight - 280, spot.top + spot.height + 56),
    };
  }

  const bottom = Math.max(12, window.innerHeight - spot.top + 56);
  return { left, bottom };
}

export function DemoTutorialOverlay() {
  const { user } = useAuth();
  const isDemo = useMemo(
    () => (user ? RBACService.isDemoUser(user) : false),
    [user]
  );
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [actionDone, setActionDone] = useState(false);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [spot, setSpot] = useState<SpotRect | null>(null);

  const step = DEMO_TUTORIAL_STEPS[stepIndex]!;
  const meta = MASCOTS[step.mascot];
  const needsAction = step.requireAction !== null;
  const canAdvance = !needsAction || actionDone;
  const isLast = stepIndex >= DEMO_TUTORIAL_STEPS.length - 1;
  const progress = ((stepIndex + (actionDone ? 1 : 0)) / DEMO_TUTORIAL_STEPS.length) * 100;

  useEffect(() => {
    if (!isDemo || typeof window === 'undefined') {
      return;
    }
    try {
      if (window.localStorage.getItem(DEMO_TUTORIAL_STORAGE_KEY) === '1') {
        return;
      }
    } catch {
      /* ignore */
    }
    setOpen(true);
    playSound('whoosh');
    playSound('spotlight');
  }, [isDemo]);

  const refreshSpot = useCallback(() => {
    setSpot(readTargetRect(step));
  }, [step]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    setActionDone(false);
    setShowCheckpoint(false);
    playSound('spotlight');
    const frame = window.requestAnimationFrame(() => refreshSpot());
    return () => window.cancelAnimationFrame(frame);
  }, [open, stepIndex, refreshSpot]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onResize = () => refreshSpot();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const interval = window.setInterval(refreshSpot, 350);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      window.clearInterval(interval);
    };
  }, [open, refreshSpot]);

  useEffect(() => {
    if (!open || !step.requireAction) {
      return;
    }
    return subscribeTutorialAction((action: TutorialAction) => {
      if (action !== step.requireAction || actionDone) {
        return;
      }
      setActionDone(true);
      setShowCheckpoint(true);
      playSound('checkpoint');
    });
  }, [open, step.requireAction, actionDone]);

  useEffect(() => {
    if (!open || !actionDone || !step.requireAction) {
      return;
    }
    const timer = window.setTimeout(() => {
      setShowCheckpoint(false);
      if (stepIndex >= DEMO_TUTORIAL_STEPS.length - 1) {
        return;
      }
      setStepIndex((i) => i + 1);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [actionDone, open, step.requireAction, stepIndex]);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(DEMO_TUTORIAL_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    playSound('fanfare');
    setOpen(false);
  }, []);

  const next = useCallback(() => {
    if (!canAdvance) {
      playSound('soft');
      return;
    }
    playSound('tap');
    if (isLast) {
      finish();
      return;
    }
    if (!needsAction) {
      setShowCheckpoint(true);
      playSound('checkpoint');
      window.setTimeout(() => {
        setShowCheckpoint(false);
        setStepIndex((i) => i + 1);
      }, 700);
      return;
    }
    setStepIndex((i) => i + 1);
  }, [canAdvance, isLast, finish, needsAction]);

  const skip = useCallback(() => {
    playSound('soft');
    finish();
  }, [finish]);

  if (!open || !isDemo) {
    return null;
  }

  const allowPassThrough = Boolean(step.passThrough);
  const padClass = allowPassThrough
    ? 'pointer-events-none'
    : 'pointer-events-auto';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80]"
      data-testid="demo-tutorial"
      aria-live="polite"
    >
      {/* Quest progress bar */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[82] h-1.5 bg-ink/30">
        <div
          className="h-full bg-coral transition-all duration-500"
          style={{ width: `${Math.min(100, progress)}%` }}
          data-testid="demo-tutorial-progress"
        />
      </div>

      {spot ? (
        <>
          <div
            className={`absolute left-0 right-0 top-0 bg-ink/70 ${padClass}`}
            style={{ height: Math.max(0, spot.top) }}
            aria-hidden
          />
          <div
            className={`absolute bottom-0 left-0 right-0 bg-ink/70 ${padClass}`}
            style={{ top: spot.top + spot.height }}
            aria-hidden
          />
          <div
            className={`absolute left-0 bg-ink/70 ${padClass}`}
            style={{
              top: spot.top,
              height: spot.height,
              width: Math.max(0, spot.left),
            }}
            aria-hidden
          />
          <div
            className={`absolute right-0 bg-ink/70 ${padClass}`}
            style={{
              top: spot.top,
              height: spot.height,
              left: spot.left + spot.width,
            }}
            aria-hidden
          />

          {/* Pulsing spotlight hole */}
          <div
            className="tutorial-pulse-ring pointer-events-none absolute rounded-xl border-[3px] border-coral bg-transparent"
            style={{
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
            }}
            data-testid="demo-tutorial-spotlight"
            aria-hidden
          />

          {/* Bouncing “click here” pointer */}
          <div
            className={`pointer-events-none absolute z-[83] flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-coral text-ink shadow-[3px_3px_0_rgba(28,25,23,0.35)] ${
              step.pointerSide === 'left' || step.pointerSide === 'right'
                ? 'tutorial-pointer-x'
                : 'tutorial-pointer-y'
            }`}
            style={pointerStyle(spot, step.pointerSide)}
            data-testid="demo-tutorial-pointer"
            aria-hidden
          >
            <MousePointer2 className="h-5 w-5" strokeWidth={2.5} />
          </div>
        </>
      ) : (
        <div className="pointer-events-auto absolute inset-0 bg-ink/65" aria-hidden />
      )}

      {/* Checkpoint flash */}
      {showCheckpoint && (
        <div
          className="tutorial-checkpoint-flash pointer-events-none absolute left-1/2 top-1/2 z-[85] rounded-xl border-2 border-ink bg-highlighter px-5 py-3 font-display text-xl font-bold uppercase tracking-wide text-ink shadow-[4px_4px_0_rgba(28,25,23,0.3)]"
          data-testid="demo-tutorial-checkpoint"
        >
          Checkpoint!
        </div>
      )}

      {/* Mascot coach bubble */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-tutorial-title"
        className="pointer-events-auto doodle-border absolute z-[84] w-[min(100%-1.5rem,23.75rem)] bg-paper p-3 shadow-[5px_6px_0_rgba(28,25,23,0.22)] sm:p-4"
        style={coachPlacement(spot)}
      >
        <button
          type="button"
          aria-label="Close tutorial"
          className="absolute right-2 top-2 rounded-md p-1 text-ink-muted hover:bg-white/60"
          onClick={skip}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-3">
          <div className="tutorial-mascot-bob relative h-[100px] w-[68px] shrink-0 sm:h-[120px] sm:w-[80px]">
            <Image
              src={meta.src}
              alt={meta.vibe}
              fill
              sizes="80px"
              className="object-contain object-bottom drop-shadow-[2px_3px_0_rgba(28,25,23,0.15)]"
            />
          </div>
          <div className="min-w-0 flex-1 pr-5">
            <p className="font-display text-xs font-bold uppercase tracking-wide text-marker">
              {meta.name} says
            </p>
            <h2
              id="demo-tutorial-title"
              className="mt-0.5 font-display text-lg font-bold text-ink sm:text-xl"
            >
              {step.title}
            </h2>
            <p
              className="mt-1.5 text-sm leading-relaxed text-ink-muted"
              data-testid="demo-tutorial-speech"
            >
              {step.speech}
            </p>
            <p
              className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 font-label text-[10px] font-bold uppercase tracking-wider ${
                actionDone
                  ? 'bg-highlighter/80 text-ink'
                  : 'bg-coral/25 text-ink'
              }`}
              data-testid="demo-tutorial-hint"
            >
              {actionDone ? (
                <>
                  <Check className="h-3 w-3" aria-hidden />
                  Checkpoint cleared
                </>
              ) : (
                <>
                  <MousePointer2 className="h-3 w-3" aria-hidden />
                  {step.tryHint}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
          <p className="font-label text-[10px] uppercase tracking-wider text-ink-muted">
            Stage {stepIndex + 1}/{DEMO_TUTORIAL_STEPS.length}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={skip}
              className="doodle-btn border-ink bg-paper"
            >
              Skip quest
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={next}
              disabled={!canAdvance}
              data-testid="demo-tutorial-next"
              className="doodle-btn bg-coral/95 text-ink disabled:opacity-45"
            >
              {isLast
                ? 'Finish quest'
                : needsAction && !actionDone
                  ? 'Do the action'
                  : stepIndex === 0
                    ? 'Start quest'
                    : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
