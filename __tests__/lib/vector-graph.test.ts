import {
  buildLeadGraph,
  colorForNiche,
  filterLeadsForNode,
} from '@/lib/vector-graph';
import type { Lead } from '@/types/database.types';

function makeLead(
  partial: Partial<Lead> & Pick<Lead, 'id' | 'name' | 'niche' | 'country'>
): Lead {
  return {
    phone: null,
    address: null,
    maps_url: `https://maps.google.com/${partial.id}`,
    status: 'New',
    owner_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...partial,
  };
}

describe('vector-graph', () => {
  const leads = [
    makeLead({ id: 1, name: 'Alpha Pets', niche: 'Pet Groomer', country: 'Australia' }),
    makeLead({ id: 2, name: 'Beta Design', niche: 'Interior Design', country: 'India' }),
    makeLead({
      id: 3,
      name: 'Gamma Pets',
      niche: 'Pet Groomer',
      country: 'Australia',
    }),
  ];

  it('builds a stable constellation with hubs and lead arcs', () => {
    const graph = buildLeadGraph(leads, 800, 600);

    expect(graph.nodes.some((n) => n.id === 'niche:Pet Groomer')).toBe(true);
    expect(graph.nodes.some((n) => n.id === 'country:India')).toBe(true);
    expect(graph.nodes.filter((n) => n.kind === 'lead')).toHaveLength(3);
    expect(graph.nodes.every((n) => n.fixed === true)).toBe(true);

    // Same inputs → same positions (no random / force drift)
    const again = buildLeadGraph(leads, 800, 600);
    expect(again.nodes.map((n) => `${n.id}:${n.x}:${n.y}`)).toEqual(
      graph.nodes.map((n) => `${n.id}:${n.x}:${n.y}`)
    );
  });

  it('assigns stable niche colors', () => {
    expect(colorForNiche('Pet Groomer')).toBe(colorForNiche('Pet Groomer'));
    expect(typeof colorForNiche('Interior Design')).toBe('string');
    expect(colorForNiche('Interior Design')).toMatch(/^#/);
  });

  it('filters leads for niche, country, and single lead nodes', () => {
    const graph = buildLeadGraph(leads, 800, 600);
    const niche = graph.nodes.find((n) => n.id === 'niche:Pet Groomer')!;
    const country = graph.nodes.find((n) => n.id === 'country:Australia')!;
    const lead = graph.nodes.find((n) => n.id === 'lead:1')!;

    expect(filterLeadsForNode(niche, leads).leads).toHaveLength(2);
    expect(filterLeadsForNode(country, leads).leads).toHaveLength(2);
    expect(filterLeadsForNode(lead, leads).leads).toHaveLength(1);
    expect(filterLeadsForNode(lead, leads).title).toBe('Alpha Pets');
  });
});
