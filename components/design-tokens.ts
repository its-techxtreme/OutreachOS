/** Design tokens extracted from Stitch B2B Lead Management Dark Theme */
export const designTokens = {
  colors: {
    background: {
      primary: 'bg-zinc-950',
      secondary: 'bg-zinc-900',
      elevated: 'bg-zinc-800',
    },
    text: {
      primary: 'text-zinc-100',
      secondary: 'text-zinc-400',
      accent: 'text-indigo-400',
    },
    border: {
      default: 'border-zinc-800',
      focus: 'border-indigo-500',
    },
    accent: {
      primary: 'bg-indigo-600',
      primaryHover: 'hover:bg-indigo-700',
    },
  },
  spacing: {
    card: 'p-6',
    toolbar: 'p-4',
    gap: 'gap-4',
    grid: 'gap-6',
  },
  typography: {
    metricValue: 'text-3xl font-bold tabular-nums text-zinc-100',
    metricLabel: 'text-sm text-zinc-400',
    tableHeader: 'text-xs font-medium uppercase tracking-wider text-zinc-400',
    tableCell: 'text-sm text-zinc-300',
    mono: 'font-mono tabular-nums',
  },
  radius: {
    card: 'rounded-lg',
    input: 'rounded-md',
    badge: 'rounded-full',
  },
} as const;
