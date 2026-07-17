'use client';

import Image from 'next/image';
import { MASCOTS, type MascotId } from '@/lib/mascots';

type MascotCalloutProps = {
  mascot: MascotId;
  title: string;
  children: React.ReactNode;
  /** Image on the left (default) or right */
  side?: 'left' | 'right';
  className?: string;
};

/**
 * Full mascot illustration + tip copy for empty states, onboarding, and tutorials.
 * Background page decor should use `DoodleDecor` (ink doodles), not these.
 */
export function MascotCallout({
  mascot,
  title,
  children,
  side = 'left',
  className = '',
}: MascotCalloutProps) {
  const meta = MASCOTS[mascot];
  const imageFirst = side === 'left';

  return (
    <aside
      className={`doodle-border flex flex-col items-center gap-5 bg-highlighter/40 px-5 py-6 text-left sm:flex-row sm:items-end sm:gap-6 sm:px-8 sm:py-7 ${className}`}
      data-testid="mascot-callout"
      data-mascot={mascot}
    >
      <div
        className={`relative h-[168px] w-[112px] shrink-0 sm:h-[200px] sm:w-[132px] ${imageFirst ? '' : 'sm:order-2'}`}
      >
        <Image
          src={meta.src}
          alt={meta.vibe}
          fill
          sizes="(max-width: 640px) 112px, 132px"
          className="object-contain object-bottom drop-shadow-[2px_3px_0_rgba(28,25,23,0.12)]"
        />
      </div>
      <div
        className={`min-w-0 flex-1 pb-1 text-center sm:pb-3 sm:text-left ${imageFirst ? '' : 'sm:order-1'}`}
      >
        <p className="font-display text-sm font-bold uppercase tracking-wide text-marker">
          {meta.name} says
        </p>
        <h3 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
          {title}
        </h3>
        <div className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
          {children}
        </div>
      </div>
    </aside>
  );
}
