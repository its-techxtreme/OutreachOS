import {
  GENERAL_DEFAULT_SCRIPT,
  GENERAL_SCRIPT_KEY,
  getDefaultScriptBody,
  nicheToScriptKey,
  matchNicheDefaultKey,
} from '@/lib/scripts/default-scripts';
import {
  QUEST_CATALOG,
  WEEKLY_QUEST_COUNT,
  getQuestById,
} from '@/lib/quests/quest-catalog';
import { getIsoWeekStart, seededShuffle } from '@/lib/quests/week';
import { LEAD_STATUSES } from '@/lib/filter-leads';

describe('LEAD_STATUSES', () => {
  it('uses call-friendly statuses without Contacted', () => {
    expect(LEAD_STATUSES).toEqual([
      'New',
      'Called',
      'No Answer',
      'Callback',
      'Replied',
      'Converted',
      'Archived',
    ]);
    expect(LEAD_STATUSES).not.toContain('Contacted');
  });
});

describe('default scripts', () => {
  it('returns general default', () => {
    expect(getDefaultScriptBody(GENERAL_SCRIPT_KEY)).toBe(
      GENERAL_DEFAULT_SCRIPT
    );
    expect(GENERAL_DEFAULT_SCRIPT).toContain('{business}');
    expect(GENERAL_DEFAULT_SCRIPT).toContain('{niche}');
  });

  it('slugs niche keys and matches presets', () => {
    expect(nicheToScriptKey('Pet Groomer')).toBe('pet-groomer');
    expect(matchNicheDefaultKey('Pet Groomers')).toBe('pet');
    expect(getDefaultScriptBody('cafe')).toContain('{business}');
  });
});

describe('quest catalog', () => {
  it('has at least 20 quests and weekly count of 3', () => {
    expect(QUEST_CATALOG.length).toBeGreaterThanOrEqual(20);
    expect(WEEKLY_QUEST_COUNT).toBe(3);
    expect(getQuestById('call_10')?.status).toBe('Called');
  });
});

describe('quest week helpers', () => {
  it('returns Monday ISO week start', () => {
    // 2026-07-19 is Sunday UTC → week start 2026-07-13
    expect(getIsoWeekStart(new Date('2026-07-19T12:00:00.000Z'))).toBe(
      '2026-07-13'
    );
  });

  it('seededShuffle is deterministic for same seed', () => {
    const ids = QUEST_CATALOG.map((q) => q.id);
    const a = seededShuffle(ids, 'user:2026-07-13').slice(0, 3);
    const b = seededShuffle(ids, 'user:2026-07-13').slice(0, 3);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
  });
});
