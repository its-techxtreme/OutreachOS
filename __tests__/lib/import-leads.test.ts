import { importValidatedLeads } from '@/lib/import/import-leads';
import { submitLead } from '@/lib/leads';

jest.mock('@/lib/leads', () => ({
  submitLead: jest.fn(),
}));

describe('importValidatedLeads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates valid leads and skips invalid rows', async () => {
    (submitLead as jest.Mock).mockResolvedValue({
      kind: 'created',
      id: 1,
      created_at: new Date().toISOString(),
    });

    const summary = await importValidatedLeads([
      {
        'Business Name': 'Good Co',
        Niche: 'SaaS',
        Country: 'USA',
        'Google Maps Link': 'https://www.google.com/maps/place/Good',
      },
      { Niche: 'Missing name only' },
      {
        'Business Name': 'Good Co Dup',
        Niche: 'SaaS',
        Country: 'USA',
        'Google Maps Link': 'https://www.google.com/maps/place/Good',
      },
    ]);

    expect(summary.created).toBe(1);
    expect(summary.duplicates).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(submitLead).toHaveBeenCalledTimes(1);
  });

  it('counts database duplicates separately', async () => {
    (submitLead as jest.Mock).mockResolvedValue({ kind: 'duplicate' });

    const summary = await importValidatedLeads([
      {
        Name: 'Existing',
        Niche: 'Retail',
        Country: 'UK',
        maps_url: 'https://www.google.com/maps/place/Existing',
      },
    ]);

    expect(summary.created).toBe(0);
    expect(summary.duplicates).toBe(1);
    expect(summary.failed).toBe(0);
  });
});
