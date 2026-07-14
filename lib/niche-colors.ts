import type { BadgeProps } from '@/components/ui/badge';

const NICHE_VARIANTS: BadgeProps['variant'][] = [
  'default',
  'info',
  'purple',
  'success',
  'warning',
  'secondary',
];

export function getNicheVariant(niche: string): BadgeProps['variant'] {
  let hash = 0;

  for (let index = 0; index < niche.length; index += 1) {
    hash = niche.charCodeAt(index) + ((hash << 5) - hash);
  }

  const variantIndex = Math.abs(hash) % NICHE_VARIANTS.length;
  return NICHE_VARIANTS[variantIndex] ?? 'default';
}
