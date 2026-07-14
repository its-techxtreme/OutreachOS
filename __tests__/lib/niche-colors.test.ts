import { getNicheVariant } from '@/lib/niche-colors';

describe('getNicheVariant', () => {
  it('returns a consistent variant for the same niche', () => {
    expect(getNicheVariant('SaaS')).toBe(getNicheVariant('SaaS'));
  });

  it('returns different variants for different niches when possible', () => {
    const variants = new Set([
      getNicheVariant('SaaS'),
      getNicheVariant('FinTech'),
      getNicheVariant('Healthcare'),
    ]);

    expect(variants.size).toBeGreaterThan(1);
  });
});
