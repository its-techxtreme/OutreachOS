import { render, screen } from '@testing-library/react';

import { LeadStickyNotePanel } from '@/components/dashboard/LeadStickyNotePanel';
import type { Lead } from '@/types/database.types';

const lead: Lead = {
  id: 1,
  name: 'Acme Cafe',
  niche: 'Cafe',
  country: 'India',
  phone: '+91 9876543210',
  address: '12 Main',
  maps_url: 'https://maps.google.com/?q=Acme',
  status: 'New',
  owner_id: 'user-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('LeadStickyNotePanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scripts: {} }),
    }) as unknown as typeof fetch;
  });

  it('renders lead focus and general script when open', async () => {
    render(
      <LeadStickyNotePanel
        open
        onClose={jest.fn()}
        selectedLead={lead}
        vaultNiches={['Cafe']}
      />
    );

    expect(screen.getByTestId('lead-sticky-note-panel')).toBeInTheDocument();
    expect(screen.getByTestId('sticky-lead-focus')).toHaveTextContent(
      'Acme Cafe'
    );
    expect(await screen.findByTestId('script-editor')).toBeInTheDocument();
  });

  it('returns null when closed', () => {
    const { container } = render(
      <LeadStickyNotePanel
        open={false}
        onClose={jest.fn()}
        selectedLead={null}
        vaultNiches={[]}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
