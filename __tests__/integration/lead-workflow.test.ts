import { POST } from '@/app/api/agent/leads/route';
import { submitLead } from '@/lib/leads';

jest.mock('@/lib/leads', () => ({ submitLead: jest.fn() }));
jest.mock('@/lib/rate-limiter', () => ({
  getRateLimiterForAuth: jest.fn(() => ({
    check: jest.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, resetTime: Date.now() + 60000 }),
  })),
  agentLeadsRateLimiter: { check: jest.fn().mockResolvedValue(undefined) },
}));

const agentHeaders = {
  'content-type': 'application/json',
  'X-Agent-Secret': 'test-agent-secret',
};

describe('lead workflow integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('simulates a ChatGPT agent submission lifecycle', async () => {
    (submitLead as jest.Mock).mockResolvedValueOnce({
      kind: 'created',
      id: 1001,
      created_at: '2026-06-19T12:00:00.000Z',
    });

    const createResponse = await POST(
      new Request('http://localhost:3000/api/agent/leads', {
        method: 'POST',
        headers: agentHeaders,
        body: JSON.stringify({
          lead: {
            name: 'Paws & Claws Grooming',
            niche: 'Pet Grooming',
            country: 'Canada',
            maps_url: 'https://maps.google.com/?q=paws-claws-grooming',
          },
          metadata: { source: 'chatgpt', version: '1.0' },
        }),
      })
    );

    const createBody = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(createBody.data.id).toBe(1001);

    (submitLead as jest.Mock).mockResolvedValueOnce({ kind: 'duplicate' });

    const duplicateResponse = await POST(
      new Request('http://localhost:3000/api/agent/leads', {
        method: 'POST',
        headers: agentHeaders,
        body: JSON.stringify({
          lead: {
            name: 'Paws & Claws Grooming',
            niche: 'Pet Grooming',
            country: 'Canada',
            maps_url: 'https://maps.google.com/?q=paws-claws-grooming',
          },
        }),
      })
    );

    const duplicateBody = await duplicateResponse.json();
    expect(duplicateResponse.status).toBe(200);
    expect(duplicateBody.skipped).toBe(true);
  });

  it('meets authentication failure performance expectations', async () => {
    const startedAt = Date.now();
    const response = await POST(
      new Request('http://localhost:3000/api/agent/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lead: {
            name: 'Unauthorized Lead',
            niche: 'Testing',
            country: 'United States',
            maps_url: 'https://maps.google.com/?q=unauthorized',
          },
        }),
      })
    );

    expect(response.status).toBe(401);
    expect(Date.now() - startedAt).toBeLessThan(50);
  });
});
