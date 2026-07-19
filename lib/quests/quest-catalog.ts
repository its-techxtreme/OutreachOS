import type { LeadStatus } from '@/types/database.types';

export type QuestKind = 'status_count' | 'manual';

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  kind: QuestKind;
  target: number;
  /** Required when kind is status_count */
  status?: LeadStatus;
  manualAllowed: boolean;
}

export const QUEST_CATALOG: QuestDefinition[] = [
  {
    id: 'call_10',
    title: 'Dial ten',
    description: 'Mark 10 leads as Called this week.',
    kind: 'status_count',
    status: 'Called',
    target: 10,
    manualAllowed: false,
  },
  {
    id: 'call_5',
    title: 'Warm-up five',
    description: 'Mark 5 leads as Called.',
    kind: 'status_count',
    status: 'Called',
    target: 5,
    manualAllowed: false,
  },
  {
    id: 'callback_3',
    title: 'Callback stack',
    description: 'Set Callback on 3 leads.',
    kind: 'status_count',
    status: 'Callback',
    target: 3,
    manualAllowed: false,
  },
  {
    id: 'no_answer_5',
    title: 'Ghost log',
    description: 'Log No Answer on 5 leads (honest dialing).',
    kind: 'status_count',
    status: 'No Answer',
    target: 5,
    manualAllowed: false,
  },
  {
    id: 'replied_2',
    title: 'Two replies',
    description: 'Move 2 leads to Replied.',
    kind: 'status_count',
    status: 'Replied',
    target: 2,
    manualAllowed: false,
  },
  {
    id: 'convert_1',
    title: 'One win',
    description: 'Convert 1 lead.',
    kind: 'status_count',
    status: 'Converted',
    target: 1,
    manualAllowed: false,
  },
  {
    id: 'call_20',
    title: 'Power hour',
    description: 'Mark 20 leads as Called.',
    kind: 'status_count',
    status: 'Called',
    target: 20,
    manualAllowed: false,
  },
  {
    id: 'callback_1',
    title: 'Book a callback',
    description: 'Set Callback on at least 1 lead.',
    kind: 'status_count',
    status: 'Callback',
    target: 1,
    manualAllowed: false,
  },
  {
    id: 'replied_5',
    title: 'Conversation streak',
    description: 'Get 5 leads to Replied.',
    kind: 'status_count',
    status: 'Replied',
    target: 5,
    manualAllowed: false,
  },
  {
    id: 'archive_3',
    title: 'Clear the deadwood',
    description: 'Archive 3 leads that are not a fit.',
    kind: 'status_count',
    status: 'Archived',
    target: 3,
    manualAllowed: false,
  },
  {
    id: 'convert_3',
    title: 'Hat trick',
    description: 'Convert 3 leads this week.',
    kind: 'status_count',
    status: 'Converted',
    target: 3,
    manualAllowed: false,
  },
  {
    id: 'no_answer_10',
    title: 'Persistence',
    description: 'Log No Answer 10 times (then try again later).',
    kind: 'status_count',
    status: 'No Answer',
    target: 10,
    manualAllowed: false,
  },
  {
    id: 'manual_script_review',
    title: 'Script polish',
    description: 'Open your sticky scripts and personalize the General pitch.',
    kind: 'manual',
    target: 1,
    manualAllowed: true,
  },
  {
    id: 'manual_focus_block',
    title: 'Focus block',
    description: 'Do a 25-minute uninterrupted dial session.',
    kind: 'manual',
    target: 1,
    manualAllowed: true,
  },
  {
    id: 'manual_map_check',
    title: 'Maps check',
    description: 'Open Maps for 5 leads before dialing (claim when done).',
    kind: 'manual',
    target: 1,
    manualAllowed: true,
  },
  {
    id: 'manual_niche_script',
    title: 'Niche sticky',
    description: 'Edit a niche-wise sticky note to match your offer.',
    kind: 'manual',
    target: 1,
    manualAllowed: true,
  },
  {
    id: 'manual_export_review',
    title: 'List hygiene',
    description: 'Export your filtered list and skim for bad numbers.',
    kind: 'manual',
    target: 1,
    manualAllowed: true,
  },
  {
    id: 'manual_water',
    title: 'Stay human',
    description: 'Take a water break mid-session. Claim when you did.',
    kind: 'manual',
    target: 1,
    manualAllowed: true,
  },
  {
    id: 'call_15',
    title: 'Steady fifteen',
    description: 'Mark 15 leads as Called.',
    kind: 'status_count',
    status: 'Called',
    target: 15,
    manualAllowed: false,
  },
  {
    id: 'callback_5',
    title: 'Follow-up five',
    description: 'Set Callback on 5 leads.',
    kind: 'status_count',
    status: 'Callback',
    target: 5,
    manualAllowed: false,
  },
];

export const WEEKLY_QUEST_COUNT = 3;

export function getQuestById(id: string): QuestDefinition | undefined {
  return QUEST_CATALOG.find((q) => q.id === id);
}

export function listQuestIds(): string[] {
  return QUEST_CATALOG.map((q) => q.id);
}
