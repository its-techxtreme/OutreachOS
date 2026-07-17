import { MASCOT_IDS, MASCOTS } from '@/lib/mascots';

describe('mascots', () => {
  it('exposes four full-illustration mascots under /mascots', () => {
    expect(MASCOT_IDS).toHaveLength(4);
    for (const id of MASCOT_IDS) {
      expect(MASCOTS[id].src).toBe(`/mascots/${id}.png`);
      expect(MASCOTS[id].name.length).toBeGreaterThan(0);
    }
  });
});
