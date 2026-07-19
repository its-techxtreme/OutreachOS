import type { MascotId } from '@/lib/mascots';
import type { TutorialAction } from '@/lib/demo/tutorial-bus';

/** Bump to force returning demos to see the new game-style tour. */
export const DEMO_TUTORIAL_STORAGE_KEY = 'outreachos_demo_tutorial_v3';

export type TutorialStepId =
  | 'welcome'
  | 'metrics'
  | 'search'
  | 'niche'
  | 'country'
  | 'status'
  | 'clear'
  | 'export'
  | 'maps'
  | 'vector'
  | 'vector-node'
  | 'done';

export type PointerSide = 'top' | 'bottom' | 'left' | 'right';

export type TutorialStep = {
  id: TutorialStepId;
  mascot: MascotId;
  title: string;
  speech: string;
  /** Tight control selector — never the whole page. */
  targetSelector: string | null;
  requireAction: TutorialAction | null;
  tryHint: string;
  pointerSide: PointerSide;
  /** Soft max so huge regions still feel like a pinpoint. */
  maxSpotWidth?: number;
  maxSpotHeight?: number;
  /** When true, dim pads don't block (portals / canvas). */
  passThrough?: boolean;
};

export const DEMO_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    mascot: 'adventurer',
    title: 'Quest start!',
    speech:
      "I'm Rio — your vault guide. We'll train on sample leads only. Follow the glow, tap what I point at, and listen for the checkpoint chime.",
    targetSelector: null,
    requireAction: null,
    tryHint: 'Press Start quest to begin.',
    pointerSide: 'bottom',
  },
  {
    id: 'metrics',
    mascot: 'adventurer',
    title: 'Read the scoreboard',
    speech:
      'These cards show pool depth, matches, and niche diversity. Tap the metrics strip so you know where to glance mid-campaign.',
    targetSelector: '[data-tutorial="metrics"]',
    requireAction: 'view-metrics',
    tryHint: 'Click the metrics panel.',
    pointerSide: 'bottom',
    maxSpotHeight: 140,
  },
  {
    id: 'search',
    mascot: 'citygirl',
    title: 'Search the sketchbook',
    speech:
      "I'm Mira. Type a cafe name or niche here. The result count updates live — that's your first power move.",
    targetSelector: '[data-tutorial="search"]',
    requireAction: 'search',
    tryHint: 'Type in the search box.',
    pointerSide: 'bottom',
  },
  {
    id: 'niche',
    mascot: 'citygirl',
    title: 'Filter by niche',
    speech:
      'Open Niche and pick one segment. Build tonight’s call list from a single vertical.',
    targetSelector: '[data-tutorial="niche"]',
    requireAction: 'filter-niche',
    tryHint: 'Choose any niche (not All).',
    pointerSide: 'bottom',
    passThrough: true,
  },
  {
    id: 'country',
    mascot: 'citygirl',
    title: 'Filter by country',
    speech:
      'Now lock a region. Country + niche is how pros narrow a vault before dialing.',
    targetSelector: '[data-tutorial="country"]',
    requireAction: 'filter-country',
    tryHint: 'Choose any country (not All).',
    pointerSide: 'bottom',
    passThrough: true,
  },
  {
    id: 'status',
    mascot: 'fighter',
    title: 'Filter by status',
    speech:
      "Kai here. Status slices New vs Called vs Converted. Pick one so you only see that pipeline stage.",
    targetSelector: '[data-tutorial="status"]',
    requireAction: 'filter-status',
    tryHint: 'Choose a status filter.',
    pointerSide: 'bottom',
    passThrough: true,
  },
  {
    id: 'clear',
    mascot: 'fighter',
    title: 'Clear the slate',
    speech:
      'Filters stacking up? Hit Clear to reset search and dropdowns in one tap.',
    targetSelector: '[data-tutorial="clear-filters"]',
    requireAction: 'clear-filters',
    tryHint: 'Click Clear.',
    pointerSide: 'top',
  },
  {
    id: 'export',
    mascot: 'fighter',
    title: 'Export your list',
    speech:
      'Export CSV downloads the filtered rows for sheets or dialers. Try it once — demo data only.',
    targetSelector: '[data-tutorial="export"]',
    requireAction: 'export-csv',
    tryHint: 'Click Export CSV.',
    pointerSide: 'top',
  },
  {
    id: 'maps',
    mascot: 'fighter',
    title: 'Open a map pin',
    speech:
      'Each row has a maps action. Click it to open the business location. We never auto-message anyone.',
    targetSelector: '[data-tutorial="maps-link"]',
    requireAction: 'open-maps',
    tryHint: 'Click a maps icon in Actions.',
    pointerSide: 'left',
  },
  {
    id: 'vector',
    mascot: 'athlete',
    title: 'Enter vector view',
    speech:
      "Ace checking in. Flip to Vector — niches and countries become a living graph.",
    targetSelector: '[data-tutorial="vector-toggle"]',
    requireAction: 'toggle-vector',
    tryHint: 'Click Switch to vector view.',
    pointerSide: 'bottom',
  },
  {
    id: 'vector-node',
    mascot: 'athlete',
    title: 'Inspect a cluster',
    speech:
      'Click any glowing node. The sidebar lists related leads — that’s your outreach cluster.',
    targetSelector: '[data-tutorial="vector-vault"]',
    requireAction: 'open-vector-node',
    tryHint: 'Click a graph node.',
    pointerSide: 'left',
    maxSpotWidth: 420,
    maxSpotHeight: 320,
    passThrough: true,
  },
  {
    id: 'done',
    mascot: 'adventurer',
    title: 'Quest complete!',
    speech:
      'You’ve trained every core move. Explore freely — create a real account when you’re ready for your own vault.',
    targetSelector: null,
    requireAction: null,
    tryHint: 'Claim your finish badge.',
    pointerSide: 'bottom',
  },
];
