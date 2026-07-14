import { POST } from '@/app/api/agent/leads/route';
import { submitLead } from '@/lib/leads';

jest.mock('@/lib/leads', () => ({ submitLead: jest.fn() }));

const baseLead = {
  name: 'Elegant Interiors LLC',
  niche: 'Interior Design',
  country: 'United States',
  phone: '+1-555-0123',
  address: '123 Design St, New York, NY 10001',
  maps_url: 'https://maps.google.com/place?cid=chatgpt-integration-test',
};

describe('ChatGPT integration workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createAgentRequest(mapsUrl: string) {
    return new Request('http://localhost:3000/api/agent/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Agent-Secret': 'test-agent-secret',
      },
      body: JSON.stringify({ lead: { ...baseLead, maps_url: mapsUrl } }),
    });
  }

  it('completes the lead submission workflow including duplicate handling', async () => {
    (submitLead as jest.Mock)
      .mockResolvedValueOnce({
        kind: 'created',
        id: 501,
        created_at: '2026-07-09T00:00:00.000Z',
      })
      .mockResolvedValueOnce({ kind: 'duplicate' });

    const first = await POST(createAgentRequest(baseLead.maps_url));
    const firstBody = await first.json();

    expect(first.status).toBe(201);
    expect(firstBody.success).toBe(true);
    expect(firstBody.data.id).toBe(501);

    const second = await POST(createAgentRequest(baseLead.maps_url));
    const secondBody = await second.json();

    expect(second.status).toBe(200);
    expect(secondBody.skipped).toBe(true);
  });

  it('returns validation errors for incomplete chatgpt payloads', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/agent/leads', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Agent-Secret': 'test-agent-secret',
        },
        body: JSON.stringify({
          lead: {
            name: 'Missing Fields Co',
            niche: 'Interior Design',
            country: 'United States',
          },
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});
