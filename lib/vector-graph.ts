import type { Lead } from '@/types/database.types';

export type GraphNodeKind = 'lead' | 'niche' | 'country';

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lead?: Lead;
  fixed?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface LeadGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NICHE_PALETTE = [
  '#7c8cff',
  '#5eead4',
  '#f0abfc',
  '#fbbf24',
  '#fb7185',
  '#34d399',
  '#38bdf8',
  '#c4b5fd',
  '#f472b6',
  '#a3e635',
  '#fcd34d',
  '#67e8f9',
  '#fda4af',
  '#86efac',
  '#93c5fd',
  '#e9d5ff',
];

export function colorForNiche(niche: string): string {
  let hash = 0;
  for (let i = 0; i < niche.length; i += 1) {
    hash = (hash * 31 + niche.charCodeAt(i)) >>> 0;
  }
  return NICHE_PALETTE[hash % NICHE_PALETTE.length]!;
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

/**
 * Stable constellation layout (deterministic, no force jitter):
 * - countries on an inner ring
 * - niches evenly spaced on a mid ring, grouped by home country
 * - leads in tidy outward arcs around each niche
 */
export function buildLeadGraph(
  leads: Lead[],
  width: number,
  height: number
): LeadGraph {
  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(width, height);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const niches = [...new Set(leads.map((l) => l.niche))].sort();
  const countries = [...new Set(leads.map((l) => l.country))].sort();

  const leadsByNiche = new Map<string, Lead[]>();
  for (const lead of leads) {
    const list = leadsByNiche.get(lead.niche) ?? [];
    list.push(lead);
    leadsByNiche.set(lead.niche, list);
  }

  const nicheHomeCountry = new Map<string, string>();
  for (const niche of niches) {
    const counts = new Map<string, number>();
    for (const lead of leadsByNiche.get(niche) ?? []) {
      counts.set(lead.country, (counts.get(lead.country) ?? 0) + 1);
    }
    let best = countries[0] ?? 'Unknown';
    let bestCount = -1;
    for (const [country, count] of counts) {
      if (count > bestCount) {
        best = country;
        bestCount = count;
      }
    }
    nicheHomeCountry.set(niche, best);
  }

  const countryRing = scale * 0.2;
  const nicheRing = scale * 0.42;

  const countryAngles = new Map<string, number>();
  countries.forEach((country, index) => {
    const angle =
      -Math.PI / 2 + (index / Math.max(countries.length, 1)) * Math.PI * 2;
    countryAngles.set(country, angle);
    const pos = polar(cx, cy, countryRing, angle);
    nodes.push({
      id: `country:${country}`,
      label: country,
      kind: 'country',
      color: '#d4d4d8',
      radius: 18,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      fixed: true,
    });
  });

  // Order niches by home-country angle so sectors stay clean
  const orderedNiches = [...niches].sort((a, b) => {
    const aa = countryAngles.get(nicheHomeCountry.get(a) ?? '') ?? 0;
    const bb = countryAngles.get(nicheHomeCountry.get(b) ?? '') ?? 0;
    if (aa !== bb) return aa - bb;
    return a.localeCompare(b);
  });

  const nichePositions = new Map<string, { x: number; y: number; angle: number }>();
  orderedNiches.forEach((niche, index) => {
    // Even spacing around the full ring keeps labels readable
    const angle =
      -Math.PI / 2 +
      ((index + 0.5) / Math.max(orderedNiches.length, 1)) * Math.PI * 2;
    const pos = polar(cx, cy, nicheRing, angle);
    nichePositions.set(niche, { ...pos, angle });
    nodes.push({
      id: `niche:${niche}`,
      label: niche,
      kind: 'niche',
      color: colorForNiche(niche),
      radius: 11,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      fixed: true,
    });
  });

  for (const niche of orderedNiches) {
    const hub = nichePositions.get(niche);
    if (!hub) continue;
    const nicheLeads = (leadsByNiche.get(niche) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    const count = nicheLeads.length;
    const ringRadius = Math.min(72, 28 + Math.sqrt(Math.max(count, 1)) * 8);

    nicheLeads.forEach((lead, index) => {
      const arcSpan = Math.min(Math.PI * 1.2, 0.18 * count + 0.7);
      const start = hub.angle - arcSpan / 2;
      const t = count === 1 ? 0.5 : index / (count - 1);
      const angle = start + t * arcSpan;
      const pos = polar(hub.x, hub.y, ringRadius, angle);
      const id = `lead:${lead.id}`;
      nodes.push({
        id,
        label: lead.name,
        kind: 'lead',
        color: colorForNiche(lead.niche),
        radius: 3.8,
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        lead,
        fixed: true,
      });
      edges.push({ source: id, target: `niche:${lead.niche}` });
    });

    const home = nicheHomeCountry.get(niche);
    if (home) {
      edges.push({ source: `niche:${niche}`, target: `country:${home}` });
    }
  }

  return { nodes, edges };
}

export function filterLeadsForNode(
  node: GraphNode,
  allLeads: Lead[]
): { title: string; subtitle: string; leads: Lead[] } {
  if (node.kind === 'lead' && node.lead) {
    return {
      title: node.lead.name,
      subtitle: `${node.lead.niche} · ${node.lead.country}`,
      leads: [node.lead],
    };
  }

  if (node.kind === 'niche') {
    const niche = node.label;
    const filtered = allLeads.filter((l) => l.niche === niche);
    return {
      title: niche,
      subtitle: `${filtered.length} leads in this niche`,
      leads: filtered,
    };
  }

  const country = node.label;
  const filtered = allLeads.filter((l) => l.country === country);
  return {
    title: country,
    subtitle: `${filtered.length} leads in this country`,
    leads: filtered,
  };
}
