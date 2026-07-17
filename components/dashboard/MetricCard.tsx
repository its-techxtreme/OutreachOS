'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  label: string;
  value: number;
  isLoading?: boolean;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

function formatChange(change: number, changeType: MetricCardProps['changeType']) {
  const prefix = changeType === 'decrease' ? '-' : changeType === 'increase' ? '+' : '';
  return `${prefix}${Math.abs(change)}%`;
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  isLoading = false,
  change,
  changeType = 'neutral',
}: MetricCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (isLoading) {
    return (
      <div
        className="doodle-border-soft bg-paper-deep px-5 py-4"
        aria-busy="true"
      >
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-9 w-24" />
      </div>
    );
  }

  return (
    <div
      className="doodle-border-soft bg-paper px-5 py-4 transition-colors hover:bg-highlighter/20"
      aria-label={`${label}: ${value.toLocaleString()}`}
    >
      <p className="font-label text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      <motion.p
        key={value}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-2 font-display text-3xl font-bold tabular-nums tracking-tight text-ink"
      >
        {value.toLocaleString()}
      </motion.p>
      {change !== undefined && (
        <p
          className={cn(
            'mt-2 text-xs tabular-nums',
            changeType === 'increase' && 'text-success',
            changeType === 'decrease' && 'text-danger',
            changeType === 'neutral' && 'text-ink-muted'
          )}
        >
          {formatChange(change, changeType)}
        </p>
      )}
    </div>
  );
});
