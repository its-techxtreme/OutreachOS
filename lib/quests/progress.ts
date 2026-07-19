import type { SupabaseClient } from '@supabase/supabase-js';

import { getQuestById } from '@/lib/quests/quest-catalog';
import { getIsoWeekStart } from '@/lib/quests/week';
import type { Database, LeadStatus } from '@/types/database.types';

type AdminClient = SupabaseClient<Database>;

/**
 * Increment weekly quests that listen for a status transition.
 * No-op when quest board is disabled or no matching quests this week.
 */
export async function applyStatusQuestProgress(
  supabase: AdminClient,
  userId: string,
  status: LeadStatus
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('quest_board_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  // Demo accounts may lack a profile row until first Quest Board fetch;
  // still allow progress when the flag is explicitly on.
  if (!profile?.quest_board_enabled) {
    return;
  }

  const weekStart = getIsoWeekStart(new Date());

  const { data: rows } = await supabase
    .from('user_weekly_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .is('completed_at', null);

  if (!rows?.length) {
    return;
  }

  for (const row of rows) {
    const quest = getQuestById(row.quest_id);
    if (!quest || quest.kind !== 'status_count') {
      continue;
    }
    if (quest.status !== status) {
      continue;
    }

    const nextProgress = Math.min(row.progress + 1, row.target);
    const completed =
      nextProgress >= row.target
        ? new Date().toISOString()
        : row.completed_at;

    await supabase
      .from('user_weekly_quests')
      .update({
        progress: nextProgress,
        completed_at: completed,
      })
      .eq('id', row.id);
  }
}
