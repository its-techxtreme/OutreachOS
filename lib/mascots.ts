/** Full-illustration mascots for tips, empty states, and tutorials (not background decor). */

export const MASCOT_IDS = ['adventurer', 'fighter', 'athlete', 'citygirl'] as const;

export type MascotId = (typeof MASCOT_IDS)[number];

export type MascotMeta = {
  id: MascotId;
  name: string;
  src: string;
  /** Short vibe line for alt text / accessibility */
  vibe: string;
};

export const MASCOTS: Record<MascotId, MascotMeta> = {
  adventurer: {
    id: 'adventurer',
    name: 'Rio',
    src: '/mascots/adventurer.png',
    vibe: 'Grinning scarf adventurer ready to jump in',
  },
  fighter: {
    id: 'fighter',
    name: 'Kai',
    src: '/mascots/fighter.png',
    vibe: 'Focused fighter who keeps the vault sharp',
  },
  athlete: {
    id: 'athlete',
    name: 'Ace',
    src: '/mascots/athlete.png',
    vibe: 'Court athlete hyped to hit the next list',
  },
  citygirl: {
    id: 'citygirl',
    name: 'Mira',
    src: '/mascots/citygirl.png',
    vibe: 'Notebook girl who keeps outreach organized',
  },
};
