import Image from 'next/image';
import Link from 'next/link';

type BrandLockupProps = {
  href?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
};

const SIZE = {
  sm: { box: 28, text: 'text-lg sm:text-xl', img: 'h-7 w-7' },
  md: { box: 36, text: 'text-xl sm:text-2xl md:text-3xl', img: 'h-8 w-8 sm:h-9 sm:w-9' },
  lg: { box: 48, text: 'text-2xl sm:text-3xl md:text-4xl', img: 'h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12' },
} as const;

export function BrandLockup({
  href = '/',
  size = 'md',
  showWordmark = true,
  className = '',
}: BrandLockupProps) {
  const dims = SIZE[size];

  const inner = (
    <span
      className="inline-flex max-w-full items-center gap-1.5 text-ink sm:gap-2"
      data-testid="brand-lockup"
    >
      <Image
        src="/brand/outreachos-logo-512.png"
        alt="OutreachOS logo"
        width={dims.box}
        height={dims.box}
        className={`shrink-0 rounded-md object-contain ${dims.img}`}
        priority={size !== 'sm'}
      />
      {showWordmark && (
        <span
          className={`font-display font-bold tracking-tight ${dims.text}`}
          aria-label="OutreachOS"
        >
          Outreach<span className="text-marker">OS</span>
        </span>
      )}
    </span>
  );

  if (href === null) {
    return (
      <span className={className || undefined} data-testid="brand-lockup-wrap">
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex max-w-full items-center rounded-sm outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-marker ${className}`}
      data-testid="brand-lockup-link"
    >
      {inner}
    </Link>
  );
}
