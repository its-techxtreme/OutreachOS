'use client';

import { LEAD_STATUSES } from '@/lib/filter-leads';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/types/database.types';

const STATUS_CHIP_CLASS: Record<LeadStatus, string> = {
  New: 'border-ink/40 bg-paper text-ink-muted',
  Called: 'border-marker bg-marker/15 text-marker',
  'No Answer': 'border-ink/50 bg-paper-deep text-ink-muted',
  Callback: 'border-coral bg-coral/15 text-coral',
  Replied: 'border-sky-600 bg-sky-500/15 text-sky-800',
  Converted: 'border-emerald-600 bg-emerald-500/15 text-emerald-800',
  Archived: 'border-ink/30 bg-ink/5 text-ink-muted',
};

export interface StatusChipsProps {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function StatusChips({
  value,
  onChange,
  disabled = false,
  className,
}: StatusChipsProps) {
  return (
    <div
      role="group"
      aria-label="Lead call status"
      data-testid="status-chips"
      className={cn('flex flex-wrap gap-1.5', className)}
    >
      {LEAD_STATUSES.map((status) => {
        const selected = status === value;
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            data-testid={`status-chip-${status}`}
            aria-pressed={selected}
            onClick={() => onChange(status)}
            className={cn(
              'rounded-md border px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors',
              STATUS_CHIP_CLASS[status],
              selected && 'ring-2 ring-ink ring-offset-1 ring-offset-paper',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      data-testid="status-badge"
      className={cn(
        'inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        STATUS_CHIP_CLASS[status]
      )}
    >
      {status}
    </span>
  );
}
