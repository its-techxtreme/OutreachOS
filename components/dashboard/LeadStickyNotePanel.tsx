'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Minimize2, StickyNote, X } from 'lucide-react';

import { StatusChips } from '@/components/dashboard/StatusChips';
import { Button } from '@/components/ui/button';
import { playSound } from '@/lib/sound';
import {
  GENERAL_SCRIPT_KEY,
  SCRIPT_PLACEHOLDERS,
  getDefaultScriptBody,
  listPresetNicheKeys,
  nicheToScriptKey,
} from '@/lib/scripts/default-scripts';
import { cn } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types/database.types';

export interface LeadStickyNotePanelProps {
  open: boolean;
  onClose: () => void;
  selectedLead: Lead | null;
  vaultNiches: string[];
  onStatusChange?: (leadId: number, status: LeadStatus) => Promise<void>;
  statusUpdating?: boolean;
}

type ScriptTab = 'general' | string;

export function LeadStickyNotePanel({
  open,
  onClose,
  selectedLead,
  vaultNiches,
  onStatusChange,
  statusUpdating = false,
}: LeadStickyNotePanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [activeKey, setActiveKey] = useState<ScriptTab>(GENERAL_SCRIPT_KEY);
  const [savedScripts, setSavedScripts] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState(getDefaultScriptBody(GENERAL_SCRIPT_KEY));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const nicheTabs = useMemo(() => {
    const map = new Map<string, string>();
    for (const niche of vaultNiches) {
      map.set(nicheToScriptKey(niche), niche);
    }
    if (selectedLead) {
      map.set(nicheToScriptKey(selectedLead.niche), selectedLead.niche);
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [vaultNiches, selectedLead]);

  const presetOptions = useMemo(() => listPresetNicheKeys(), []);

  const resolveBody = useCallback(
    (key: string) => savedScripts[key] ?? getDefaultScriptBody(key),
    [savedScripts]
  );

  const lastLeadIdForTabRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const response = await fetch('/api/scripts');
        const payload = (await response.json()) as {
          scripts?: Record<string, string>;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load scripts');
        }
        if (!cancelled) {
          setSavedScripts(payload.scripts ?? {});
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load scripts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    setDraft(resolveBody(activeKey));
    setSaveMessage(null);
  }, [activeKey, resolveBody]);

  useEffect(() => {
    if (!open) {
      lastLeadIdForTabRef.current = null;
      return;
    }
    if (!selectedLead) {
      return;
    }
    // Only switch niche tab when the focused lead *identity* changes —
    // status updates must not yank the user off General mid-edit.
    if (lastLeadIdForTabRef.current === selectedLead.id) {
      return;
    }
    const nextKey = nicheToScriptKey(selectedLead.niche);
    lastLeadIdForTabRef.current = selectedLead.id;
    setActiveKey(nextKey);
  }, [selectedLead?.id, open, selectedLead]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await fetch('/api/scripts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptKey: activeKey, body: draft }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to save');
      }
      setSavedScripts((prev) => ({ ...prev, [activeKey]: draft }));
      setSaveMessage('Saved');
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      playSound('soft');
    } finally {
      setSaving(false);
    }
  }, [activeKey, draft]);

  const handleReset = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/scripts?scriptKey=${encodeURIComponent(activeKey)}`,
        { method: 'DELETE' }
      );
      const payload = (await response.json()) as {
        defaultBody?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to reset');
      }
      const next = payload.defaultBody ?? getDefaultScriptBody(activeKey);
      setSavedScripts((prev) => {
        const copy = { ...prev };
        delete copy[activeKey];
        return copy;
      });
      setDraft(next);
      setSaveMessage('Reset to default');
      playSound('whoosh');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setSaving(false);
    }
  }, [activeKey]);

  if (!open) {
    return null;
  }

  if (minimized) {
    return (
      <button
        type="button"
        data-testid="sticky-note-minimized"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border-2 border-ink bg-highlighter px-3 py-2 text-sm font-semibold text-ink shadow-[4px_4px_0_0_rgba(28,25,23,0.85)]"
      >
        <StickyNote className="h-4 w-4" />
        Scripts
      </button>
    );
  }

  return (
    <aside
      data-testid="lead-sticky-note-panel"
      aria-label="Call script sticky notes"
      className={cn(
        'fixed bottom-4 right-4 z-50 flex w-[min(100vw-1.5rem,22rem)] flex-col gap-3',
        'rotate-[-0.6deg] rounded-md border-2 border-ink bg-highlighter p-3',
        'shadow-[6px_7px_0_0_rgba(28,25,23,0.9)] sm:w-[24rem]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/70">
            Sticky scripts
          </p>
          <h2 className="text-base font-semibold text-ink">Call pitch pad</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Minimize scripts"
            className="rounded p-1 text-ink/70 hover:bg-ink/10"
            onClick={() => setMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Close scripts"
            className="rounded p-1 text-ink/70 hover:bg-ink/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selectedLead && (
        <div
          data-testid="sticky-lead-focus"
          className="rounded border border-ink/30 bg-paper/80 px-2.5 py-2 text-xs text-ink"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{selectedLead.name}</p>
              <p className="text-ink-muted">
                {selectedLead.niche} · {selectedLead.country}
              </p>
              {selectedLead.phone ? (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="mt-0.5 inline-block font-mono text-marker hover:underline"
                >
                  {selectedLead.phone}
                </a>
              ) : null}
            </div>
            <a
              href={selectedLead.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Maps"
              className="shrink-0 rounded border border-ink/40 p-1.5 hover:bg-paper"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          {onStatusChange && (
            <div className="mt-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                Status
              </p>
              <StatusChips
                value={selectedLead.status}
                disabled={statusUpdating}
                onChange={(status) => {
                  void onStatusChange(selectedLead.id, status);
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          data-testid="script-tab-general"
          onClick={() => setActiveKey(GENERAL_SCRIPT_KEY)}
          className={cn(
            'shrink-0 rounded border px-2 py-1 text-[11px] font-medium',
            activeKey === GENERAL_SCRIPT_KEY
              ? 'border-ink bg-paper text-ink'
              : 'border-ink/30 bg-transparent text-ink/70'
          )}
        >
          General
        </button>
        {nicheTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            data-testid={`script-tab-${tab.key}`}
            onClick={() => setActiveKey(tab.key)}
            className={cn(
              'shrink-0 rounded border px-2 py-1 text-[11px] font-medium',
              activeKey === tab.key
                ? 'border-ink bg-paper text-ink'
                : 'border-ink/30 bg-transparent text-ink/70'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-[11px] text-ink/70">
        <span className="shrink-0">Load preset</span>
        <select
          data-testid="script-preset-select"
          className="min-w-0 flex-1 rounded border border-ink/30 bg-paper px-2 py-1 text-ink"
          value=""
          onChange={(event) => {
            const key = event.target.value;
            if (!key) return;
            setActiveKey(key);
            if (!savedScripts[key]) {
              setDraft(getDefaultScriptBody(key));
            }
          }}
        >
          <option value="">Choose niche template…</option>
          {presetOptions.map((key) => (
            <option key={key} value={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <p className="text-[10px] leading-relaxed text-ink/70">
        Placeholders stay visible — say them live:{' '}
        {SCRIPT_PLACEHOLDERS.join(' · ')}
      </p>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading script…</p>
      ) : (
        <textarea
          data-testid="script-editor"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={10}
          className="w-full resize-y rounded border border-ink/40 bg-paper px-2.5 py-2 font-mono text-xs leading-relaxed text-ink outline-none focus:border-ink"
        />
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {saveMessage && (
        <p role="status" className="text-xs text-ink-muted">
          {saveMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          data-testid="script-save"
          disabled={saving || loading}
          onClick={() => void handleSave()}
          className="doodle-btn border-ink bg-paper text-ink"
        >
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="script-reset"
          disabled={saving || loading}
          onClick={() => void handleReset()}
          className="border-ink/50 bg-transparent text-ink"
        >
          Reset default
        </Button>
      </div>
    </aside>
  );
}
