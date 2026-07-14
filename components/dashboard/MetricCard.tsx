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
        className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-5 py-4 backdrop-blur-sm"
        aria-busy="true"
      >
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-9 w-24" />
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-5 py-4 backdrop-blur-sm transition-colors hover:border-teal-500/30 hover:bg-zinc-900/60"
      aria-label={`${label}: ${value.toLocaleString()}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <motion.p
        key={value}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-2 font-display text-3xl font-bold tabular-nums tracking-tight text-zinc-50"
      >
        {value.toLocaleString()}
      </motion.p>
      {change !== undefined && (
        <p
          className={cn(
            'mt-2 text-xs tabular-nums',
            changeType === 'increase' && 'text-emerald-400',
            changeType === 'decrease' && 'text-red-400',
            changeType === 'neutral' && 'text-zinc-500'
          )}
        >
          {formatChange(change, changeType)}
        </p>
      )}
    </div>
  );
});
