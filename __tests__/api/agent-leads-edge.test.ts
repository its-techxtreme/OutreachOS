import { POST } from '@/app/api/agent/leads/route';
import { validateApiKey } from '@/lib/auth';
import { submitLead } from '@/lib/leads';
import { getRateLimiterForAuth, rateLimiters } from '@/lib/rate-limiter';
import { MAX_REQUEST_BODY_BYTES } from '@/lib/api-helpers';

jest.mock('@/lib/leads', () => ({ submitLead: jest.fn() }));
jest.mock('@/lib/rate-limiter', () => {
  const actual = jest.requireActual('@/lib/rate-limiter');
  return {
    ...actual,
    getRateLimiterForAuth: jest.fn(actual.getRateLimiterForAuth),
  };
});

describe('agent leads route edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('authenticates via bearer api key and uses api rate limiter tier', async () => {
    process.env.API_KEYS = 'integration-api-key';

    const auth = await validateApiKey(
      new Request('http://localhost/api/agent/leads', {
        headers: { Authorization: 'Bearer integration-api-key' },
      })
    );

    expect(auth.valid).toBe(true);
    expect(getRateLimiterForAuth(auth.strategy)).toBe(rateLimiters.api);

    (submitLead as jest.Mock).mockResolvedValue({
      kind: 'created',
      id: 42,
      created_at: '2026-07-09T00:00:00.000Z',
    });

    const response = await POST(
      new Request('http://localhost:3000/api/agent/leads', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer integration-api-key',
        },
        body: JSON.stringify({
          lead: {
            name: 'API Key Lead',
            niche: 'Testing',
            country: 'United States',
            maps_url: 'https://maps.google.com/?q=api-key-lead',
          },
        }),
      })
    );

    expect(response.status).toBe(201);
    delete process.env.API_KEYS;
  });

  it('rejects oversized request bodies', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/agent/leads', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Agent-Secret': 'test-agent-secret',
          'content-length': String(MAX_REQUEST_BODY_BYTES + 1),
        },
        body: '{}',
      })
    );

    expect(response.status).toBe(400);
  });

  it('handles unexpected processing failures', async () => {
    const { getRateLimiterForAuth } = jest.requireMock('@/lib/rate-limiter');
    getRateLimiterForAuth.mockImplementationOnce(() => ({
      check: jest.fn().mockRejectedValue(new Error('Limiter backend unavailable')),
    }));

    const response = await POST(
      new Request('http://localhost:3000/api/agent/leads', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Agent-Secret': 'test-agent-secret',
        },
        body: JSON.stringify({
          lead: {
            name: 'Failure Lead',
            niche: 'Testing',
            country: 'United States',
            maps_url: 'https://maps.google.com/?q=failure-lead',
          },
        }),
      })
    );

    expect(response.status).toBe(500);
  });
});
