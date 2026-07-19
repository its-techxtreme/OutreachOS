import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';

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
    sessionStorage.clear();
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

  it('moves when the header is dragged', () => {
    render(
      <LeadStickyNotePanel
        open
        onClose={jest.fn()}
        selectedLead={lead}
        vaultNiches={['Cafe']}
      />
    );

    const panel = screen.getByTestId('lead-sticky-note-panel');
    const handle = screen.getByTestId('sticky-drag-handle');

    Object.defineProperty(panel, 'getBoundingClientRect', {
      value: () => ({
        left: 400,
        top: 200,
        right: 784,
        bottom: 500,
        width: 384,
        height: 300,
        x: 400,
        y: 200,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(panel, 'offsetWidth', { value: 384 });
    Object.defineProperty(panel, 'offsetHeight', { value: 300 });
    handle.setPointerCapture = jest.fn();

    act(() => {
      const down = createEvent.pointerDown(handle, { pointerId: 1 });
      Object.defineProperty(down, 'clientX', { get: () => 420 });
      Object.defineProperty(down, 'clientY', { get: () => 210 });
      fireEvent(handle, down);

      const move = createEvent.pointerMove(handle, { pointerId: 1 });
      Object.defineProperty(move, 'clientX', { get: () => 320 });
      Object.defineProperty(move, 'clientY', { get: () => 140 });
      fireEvent(handle, move);

      fireEvent.pointerUp(handle, { pointerId: 1 });
    });

    expect(panel.style.left).toBe('300px');
    expect(panel.style.top).toBe('130px');
    expect(sessionStorage.getItem('outreachos-sticky-scripts-pos')).toContain(
      '"left":300'
    );
  });
});
