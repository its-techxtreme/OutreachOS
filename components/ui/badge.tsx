import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-marker/40 bg-marker/15 text-ink',
        secondary: 'border-ink/20 bg-paper-deep text-ink',
        success: 'border-emerald-700/30 bg-emerald-100 text-emerald-900',
        warning: 'border-amber-700/30 bg-amber-100 text-amber-950',
        info: 'border-sky-700/30 bg-sky-100 text-sky-950',
        purple: 'border-violet-700/30 bg-violet-100 text-violet-950',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
