import type { SupabaseClient } from '@supabase/supabase-js';

import {
  QUEST_CATALOG,
  WEEKLY_QUEST_COUNT,
  getQuestById,
} from '@/lib/quests/quest-catalog';
import { getIsoWeekStart, seededShuffle } from '@/lib/quests/week';
import type { Database } from '@/types/database.types';

type AdminClient = SupabaseClient<Database>;

export async function ensureWeeklyQuests(
  supabase: AdminClient,
  userId: string
): Promise<Database['public']['Tables']['user_weekly_quests']['Row'][]> {
  const weekStart = getIsoWeekStart(new Date());

  const { data: existing } = await supabase
    .from('user_weekly_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .order('id', { ascending: true });

  if (existing && existing.length > 0) {
    return existing;
  }

  const ids = seededShuffle(
    QUEST_CATALOG.map((q) => q.id),
    `${userId}:${weekStart}`
  ).slice(0, WEEKLY_QUEST_COUNT);

  const inserts = ids.map((questId) => {
    const quest = getQuestById(questId)!;
    return {
      user_id: userId,
      week_start: weekStart,
      quest_id: questId,
      progress: 0,
      target: quest.target,
    };
  });

  const { data: created, error } = await supabase
    .from('user_weekly_quests')
    .insert(inserts)
    .select('*');

  if (error) {
    throw error;
  }

  return created ?? [];
}
