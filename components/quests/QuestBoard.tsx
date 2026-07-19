'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ScrollText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { playSound } from '@/lib/sound';
import { cn } from '@/lib/utils';

interface QuestItem {
  id: number;
  questId: string;
  title: string;
  description: string;
  kind: string;
  progress: number;
  target: number;
  completedAt: string | null;
  manualAllowed: boolean;
  claimedManual: boolean;
}

interface QuestsPayload {
  enabled: boolean;
  weekStart: string;
  quests: QuestItem[];
}

export function QuestBoard({ className }: { className?: string }) {
  const [data, setData] = useState<QuestsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/quests');
      const payload = (await response.json()) as QuestsPayload & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load quests');
      }
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quests');
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 45_000);
    return () => window.clearInterval(id);
  }, [load]);

  const claim = useCallback(
    async (questId: string) => {
      setClaiming(questId);
      try {
        const response = await fetch('/api/quests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questId }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? 'Could not claim');
        }
        playSound('checkpoint');
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not claim');
        playSound('soft');
      } finally {
        setClaiming(null);
      }
    },
    [load]
  );

  if (error && !data) {
    return null;
  }

  if (!data || !data.enabled) {
    return null;
  }

  return (
    <section
      data-testid="quest-board"
      aria-label="Weekly quest board"
      className={cn(
        'doodle-border bg-paper px-4 py-3',
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-marker" />
        <div>
          <h2 className="text-sm font-semibold text-ink">Quest Board</h2>
          <p className="font-label text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Week of {data.weekStart} · 3 random quests
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs text-danger">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2.5">
        {data.quests.map((quest) => {
          const done = Boolean(quest.completedAt);
          const pct = Math.min(
            100,
            Math.round((quest.progress / Math.max(quest.target, 1)) * 100)
          );
          return (
            <li
              key={quest.id}
              data-testid={`quest-${quest.questId}`}
              className={cn(
                'rounded-md border border-ink/25 bg-paper-deep/40 px-3 py-2',
                done && 'opacity-80'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {quest.title}
                    {done ? (
                      <Check className="ml-1 inline h-3.5 w-3.5 text-emerald-700" />
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {quest.description}
                  </p>
                </div>
                {quest.manualAllowed && !done ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={claiming === quest.questId}
                    data-testid={`quest-claim-${quest.questId}`}
                    onClick={() => void claim(quest.questId)}
                    className="shrink-0 border-ink text-xs"
                  >
                    Claim
                  </Button>
                ) : null}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-marker transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] tabular-nums text-ink-muted">
                {quest.progress}/{quest.target}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
