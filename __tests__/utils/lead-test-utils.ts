import type { Lead } from '@/types/database.types';

export function createMockLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 1,
    name: 'Acme Corp',
    niche: 'SaaS',
    country: 'USA',
    phone: '+1-555-0100',
    address: '123 Main Street, New York, NY',
    maps_url: 'https://maps.google.com/?q=acme',
    status: 'New',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createMockLeads(count: number): Lead[] {
  return Array.from({ length: count }, (_, index) =>
    createMockLead({
      id: index + 1,
      name: `Business ${index + 1}`,
      niche: index % 2 === 0 ? 'SaaS' : 'FinTech',
      country: index % 3 === 0 ? 'USA' : 'UK',
      phone: `+1-555-${String(index).padStart(4, '0')}`,
      maps_url: `https://maps.google.com/?q=business-${index + 1}`,
    })
  );
}
