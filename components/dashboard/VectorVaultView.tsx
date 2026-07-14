'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Search, X } from 'lucide-react';

import { ProspectMatrixTable } from '@/components/dashboard/ProspectMatrixTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  buildLeadGraph,
  filterLeadsForNode,
  type GraphNode,
  type LeadGraph,
} from '@/lib/vector-graph';
import type { LeadSortColumn, SortDirection } from '@/lib/filter-leads';
import type { Lead } from '@/types/database.types';

interface VectorVaultViewProps {
  leads: Lead[];
  isLoading?: boolean;
}

interface SidebarState {
  title: string;
  subtitle: string;
  leads: Lead[];
  nodeId: string;
}

function matchesQuery(node: GraphNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.label.toLowerCase().includes(q)) return true;
  if (node.lead) {
    return (
      node.lead.niche.toLowerCase().includes(q) ||
      node.lead.country.toLowerCase().includes(q) ||
      (node.lead.phone?.toLowerCase().includes(q) ?? false) ||
      (node.lead.address?.toLowerCase().includes(q) ?? false)
    );
  }
  return false;
}

export function VectorVaultView({ leads, isLoading = false }: VectorVaultViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<LeadGraph | null>(null);
  const leadsRef = useRef(leads);
  const sizeRef = useRef({ width: 800, height: 600 });
  const transformRef = useRef({ scale: 1, ox: 0, oy: 0 });
  const hoverRef = useRef<GraphNode | null>(null);
  const selectedRef = useRef<GraphNode | null>(null);
  const queryRef = useRef('');
  const dirtyRef = useRef(true);
  const dragRef = useRef<{
    mode: 'pan' | 'node' | null;
    nodeId?: string;
    lastX: number;
    lastY: number;
  }>({ mode: null, lastX: 0, lastY: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredLead, setHoveredLead] = useState<Lead | null>(null);
  const [sidebar, setSidebar] = useState<SidebarState | null>(null);
  const [sortBy, setSortBy] = useState<LeadSortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  leadsRef.current = leads;

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const stats = useMemo(() => {
    const niches = new Set(leads.map((l) => l.niche)).size;
    const countries = new Set(leads.map((l) => l.country)).size;
    return { niches, countries, leads: leads.length };
  }, [leads]);

  const matchCount = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return 0;
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(q) ||
        lead.niche.toLowerCase().includes(q) ||
        lead.country.toLowerCase().includes(q) ||
        (lead.phone?.toLowerCase().includes(q) ?? false) ||
        (lead.address?.toLowerCase().includes(q) ?? false)
    ).length;
  }, [leads, searchQuery]);

  const sortedSidebarLeads = useMemo(() => {
    if (!sidebar) return [];
    const copy = [...sidebar.leads];
    copy.sort((a, b) => {
      const left = String(a[sortBy] ?? '');
      const right = String(b[sortBy] ?? '');
      const cmp = left.localeCompare(right, undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [sidebar, sortBy, sortDirection]);

  const rebuildGraph = useCallback(
    (width: number, height: number, resetCamera: boolean) => {
      sizeRef.current = { width, height };
      if (leadsRef.current.length === 0) {
        graphRef.current = null;
        markDirty();
        return;
      }
      graphRef.current = buildLeadGraph(leadsRef.current, width, height);
      if (resetCamera) {
        transformRef.current = { scale: 1, ox: 0, oy: 0 };
      }
      markDirty();
    },
    [markDirty]
  );

  // Search only highlights — never auto-zooms (that felt like runaway zoom)
  useEffect(() => {
    queryRef.current = searchQuery.trim();
    markDirty();
  }, [searchQuery, markDirty]);

  // Rebuild when lead data changes, keep current camera
  useEffect(() => {
    const { width, height } = sizeRef.current;
    rebuildGraph(width, height, true);
  }, [leads, rebuildGraph]);

  // Measure container once + on real resizes only (no layout feedback loop)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const measure = (resetCamera: boolean) => {
      const rect = el.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(320, Math.round(rect.height));
      const prev = sizeRef.current;
      const significant =
        !graphRef.current ||
        Math.abs(prev.width - width) >= 48 ||
        Math.abs(prev.height - height) >= 48;

      // Always keep paint size in sync with the box; only rebuild constellation
      // when the change is real (avoids the zoom-creep feedback loop).
      sizeRef.current = { width, height };
      markDirty();

      if (significant) {
        if (leadsRef.current.length === 0) {
          graphRef.current = null;
          return;
        }
        graphRef.current = buildLeadGraph(leadsRef.current, width, height);
        if (resetCamera) {
          transformRef.current = { scale: 1, ox: 0, oy: 0 };
        }
      }
    };

    measure(true);

    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => measure(false), 200);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [rebuildGraph, markDirty]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const { scale, ox, oy } = transformRef.current;
    return { x: (sx - ox) / scale, y: (sy - oy) / scale };
  }, []);

  const findNodeAt = useCallback(
    (sx: number, sy: number): GraphNode | null => {
      const graph = graphRef.current;
      if (!graph) return null;
      const world = screenToWorld(sx, sy);
      const scale = transformRef.current.scale;
      let best: GraphNode | null = null;
      let bestDist = Infinity;
      for (const node of graph.nodes) {
        const dist = Math.hypot(node.x - world.x, node.y - world.y);
        const hit = node.radius + 10 / scale;
        if (dist <= hit && dist < bestDist) {
          best = node;
          bestDist = dist;
        }
      }
      return best;
    },
    [screenToWorld]
  );

  const openSidebarForNode = useCallback(
    (node: GraphNode) => {
      const payload = filterLeadsForNode(node, leadsRef.current);
      setSidebar({
        title: payload.title,
        subtitle: payload.subtitle,
        leads: payload.leads,
        nodeId: node.id,
      });
      selectedRef.current = node;
      markDirty();
    },
    [markDirty]
  );

  // Paint loop: only redraw when dirty or dragging — never remeasure/rebuild here
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    let raf = 0;

    const drawFrame = () => {
      if (!running) return;
      raf = requestAnimationFrame(drawFrame);

      const dragging = dragRef.current.mode !== null;
      if (!dirtyRef.current && !dragging) return;
      dirtyRef.current = false;

      const { width, height } = sizeRef.current;
      const dpr = window.devicePixelRatio || 1;
      const nextW = Math.floor(width * dpr);
      const nextH = Math.floor(height * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.72
      );
      gradient.addColorStop(0, '#18181b');
      gradient.addColorStop(1, '#09090b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.strokeStyle = 'rgba(63,63,70,0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
      ctx.restore();

      const graph = graphRef.current;
      if (!graph) return;

      const hovered = hoverRef.current;
      const selected = selectedRef.current;
      const query = queryRef.current;
      const { scale, ox, oy } = transformRef.current;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

      for (const edge of graph.edges) {
        const a = nodeMap.get(edge.source);
        const b = nodeMap.get(edge.target);
        if (!a || !b) continue;

        const aMatch = matchesQuery(a, query);
        const bMatch = matchesQuery(b, query);
        const dimmed = Boolean(query) && !(aMatch || bMatch);
        const active =
          selected &&
          (a.id === selected.id ||
            b.id === selected.id ||
            (selected.kind === 'lead' &&
              (a.id === `niche:${selected.lead?.niche}` ||
                b.id === `niche:${selected.lead?.niche}` ||
                a.id === `country:${selected.lead?.country}` ||
                b.id === `country:${selected.lead?.country}`)) ||
            (selected.kind === 'niche' &&
              (a.lead?.niche === selected.label ||
                b.lead?.niche === selected.label ||
                a.label === selected.label ||
                b.label === selected.label)) ||
            (selected.kind === 'country' &&
              (a.lead?.country === selected.label ||
                b.lead?.country === selected.label ||
                a.label === selected.label ||
                b.label === selected.label)));

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = active
          ? 'rgba(167,139,250,0.55)'
          : dimmed
            ? 'rgba(63,63,70,0.1)'
            : query && (aMatch || bMatch)
              ? 'rgba(125,211,252,0.4)'
              : 'rgba(113,113,122,0.22)';
        ctx.lineWidth = active ? 1.4 : 0.7;
        ctx.stroke();
      }

      for (const node of graph.nodes) {
        const matched = matchesQuery(node, query);
        const dimmed = Boolean(query) && !matched;
        const isActive =
          hovered?.id === node.id ||
          selected?.id === node.id ||
          (Boolean(query) && matched && node.kind === 'lead');

        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          isActive && node.kind === 'lead' ? node.radius + 1.2 : node.radius,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = node.color;
        ctx.globalAlpha = dimmed
          ? 0.12
          : isActive
            ? 1
            : node.kind === 'lead'
              ? 0.9
              : 0.96;
        ctx.fill();

        if (!dimmed && node.kind !== 'lead') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.color}55`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (!dimmed && (node.kind !== 'lead' || isActive)) {
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = '#fafafa';
          ctx.font =
            node.kind === 'country'
              ? '600 13px ui-sans-serif, system-ui, sans-serif'
              : node.kind === 'niche'
                ? '600 11px ui-sans-serif, system-ui, sans-serif'
                : '500 10px ui-sans-serif, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            node.label.length > 26 ? `${node.label.slice(0, 24)}…` : node.label,
            node.x,
            node.y - node.radius - 8
          );
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    dirtyRef.current = true;
    raf = requestAnimationFrame(drawFrame);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const node = findNodeAt(sx, sy);
    if (node) {
      openSidebarForNode(node);
      dragRef.current = {
        mode: 'node',
        nodeId: node.id,
        lastX: sx,
        lastY: sy,
      };
    } else {
      selectedRef.current = null;
      setSidebar(null);
      dragRef.current = { mode: 'pan', lastX: sx, lastY: sy };
      markDirty();
    }
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const node = findNodeAt(sx, sy);
    if (hoverRef.current?.id !== node?.id) {
      hoverRef.current = node;
      setHoveredLead(node?.lead ?? null);
      markDirty();
    }

    const drag = dragRef.current;
    if (!drag.mode) return;

    const dx = sx - drag.lastX;
    const dy = sy - drag.lastY;
    drag.lastX = sx;
    drag.lastY = sy;

    if (drag.mode === 'pan') {
      transformRef.current.ox += dx;
      transformRef.current.oy += dy;
      markDirty();
      return;
    }

    if (drag.mode === 'node' && drag.nodeId && graphRef.current) {
      const graphNode = graphRef.current.nodes.find((n) => n.id === drag.nodeId);
      if (!graphNode) return;
      const world = screenToWorld(sx, sy);
      graphNode.x = world.x;
      graphNode.y = world.y;
      markDirty();
    }
  };

  const onPointerUp = () => {
    dragRef.current.mode = null;
    markDirty();
  };

  // Explicit zoom only (Ctrl/Meta + wheel) so page scroll never zooms the graph
  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    const prev = transformRef.current.scale;
    const next = Math.min(3.5, Math.max(0.3, prev * (event.deltaY < 0 ? 1.08 : 0.92)));
    const world = screenToWorld(sx, sy);
    transformRef.current.scale = next;
    transformRef.current.ox = sx - world.x * next;
    transformRef.current.oy = sy - world.y * next;
    markDirty();
  };

  const handleSort = useCallback((column: LeadSortColumn) => {
    setSortBy((current) => {
      if (current === column) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return current;
      }
      setSortDirection('asc');
      return column;
    });
  }, []);

  const resetView = useCallback(() => {
    transformRef.current = { scale: 1, ox: 0, oy: 0 };
    markDirty();
  }, [markDirty]);

  return (
    <section
      ref={containerRef}
      data-testid="vector-vault-view"
      aria-label="Vector vault graph view"
      className="relative h-[70vh] min-h-[520px] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
    >
      {/* Absolute canvas so sizing never feeds back into layout */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          hoverRef.current = null;
          setHoveredLead(null);
          dragRef.current.mode = null;
          markDirty();
        }}
        onWheel={onWheel}
      />

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-300 backdrop-blur">
        <p className="font-medium text-zinc-100">Vault graph</p>
        <p className="mt-1 text-zinc-400">
          {stats.leads} leads · {stats.niches} niches · {stats.countries}{' '}
          countries
        </p>
        <p className="mt-1 text-zinc-500">
          Click a node for details · Ctrl+scroll to zoom
        </p>
      </div>

      <div className="absolute left-1/2 top-4 z-30 flex w-[min(440px,70%)] -translate-x-1/2 flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            data-testid="vector-search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search leads, niches, countries…"
            className="h-10 border-zinc-700 bg-zinc-950/90 pl-9 pr-9 text-zinc-100 shadow-lg backdrop-blur placeholder:text-zinc-500"
            aria-label="Search vault graph"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center gap-2">
          {searchQuery ? (
            <p className="text-xs text-zinc-400">
              {matchCount} matching lead{matchCount === 1 ? '' : 's'}
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pointer-events-auto h-7 text-xs"
            onClick={resetView}
          >
            Reset view
          </Button>
        </div>
      </div>

      {hoveredLead && !sidebar && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 max-w-sm rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 backdrop-blur">
          <p className="font-semibold text-zinc-50">{hoveredLead.name}</p>
          <p className="mt-1 text-zinc-400">
            {hoveredLead.niche} · {hoveredLead.country}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/60 text-sm text-zinc-300">
          Loading vault…
        </div>
      )}

      {!isLoading && leads.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-sm text-zinc-400">
          No leads to map in the vault yet.
        </div>
      )}

      {sidebar && (
        <>
          <button
            type="button"
            aria-label="Dismiss details panel"
            className="absolute inset-0 z-40 bg-black/35"
            onClick={() => {
              setSidebar(null);
              selectedRef.current = null;
              markDirty();
            }}
          />
          <aside
            data-testid="vector-sidebar"
            className="absolute inset-y-0 right-0 z-50 flex w-[min(100%,520px)] flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
              <div className="min-w-0 pr-2">
                <p className="text-base font-semibold leading-snug text-zinc-100 break-words">
                  {sidebar.title}
                </p>
                <p className="mt-1 text-xs text-zinc-400">{sidebar.subtitle}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close details"
                onClick={() => {
                  setSidebar(null);
                  selectedRef.current = null;
                  markDirty();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <ProspectMatrixTable
                leads={sortedSidebarLeads}
                isLoading={false}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={handleSort}
                variant="panel"
              />
            </div>
          </aside>
        </>
      )}
    </section>
  );
}
