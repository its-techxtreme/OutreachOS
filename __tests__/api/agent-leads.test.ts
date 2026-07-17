import { POST, OPTIONS } from '@/app/api/agent/leads/route';
import { submitLead } from '@/lib/leads';

jest.mock('@/lib/leads', () => ({ submitLead: jest.fn() }));
jest.mock('@/lib/auth/agent-owner', () => ({
  resolveAgentLeadOwnerId: jest.fn().mockResolvedValue('admin-owner-id'),
}));
jest.mock('@/lib/rate-limiter', () => ({
  rateLimiters: {
    agent: { check: jest.fn() },
    api: { check: jest.fn() },
  },
  getRateLimiterForAuth: jest.fn(() => ({
    check: jest.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, resetTime: Date.now() + 60000 }),
  })),
  agentLeadsRateLimiter: { check: jest.fn() },
}));

jest.mock('@/lib/metrics', () => ({
  metrics: {
    recordApiRequest: jest.fn(),
    recordDatabaseQuery: jest.fn(),
    recordRateLimitHit: jest.fn(),
    recordAuthFailure: jest.fn(),
  },
}));

const validPayload = {
  lead: {
    name: 'Acme Interiors',
    niche: 'Interior Design',
    country: 'United States',
    phone: '+1-555-0100',
    address: '123 Design Ave',
    maps_url: 'https://maps.google.com/?q=acme-interiors',
  },
};

function createRequest(
  body: unknown = validPayload,
  headers: Record<string, string> = {
    'content-type': 'application/json',
    'X-Agent-Secret': 'test-agent-secret',
  }
): Request {
  return new Request('http://localhost:3000/api/agent/leads', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('/api/agent/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getRateLimiterForAuth } = jest.requireMock('@/lib/rate-limiter');
    getRateLimiterForAuth.mockReturnValue({
      check: jest.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, resetTime: Date.now() + 60000 }),
    });
  });

  it('handles CORS preflight requests', async () => {
    const response = await OPTIONS();
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });

  it('creates a lead successfully', async () => {
    (submitLead as jest.Mock).mockResolvedValue({
      kind: 'created',
      id: 99,
      created_at: '2026-06-19T00:00:00.000Z',
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(99);
    expect(response.headers.get('X-Request-ID')).toBeTruthy();
  });

  it('returns 200 when a duplicate lead is submitted', async () => {
    (submitLead as jest.Mock).mockResolvedValue({ kind: 'duplicate' });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.skipped).toBe(true);
  });

  it('returns 401 for missing or invalid agent secrets', async () => {
    expect(
      (await POST(createRequest(validPayload, { 'content-type': 'application/json' }))).status
    ).toBe(401);
    expect(
      (
        await POST(
          createRequest(validPayload, {
            'content-type': 'application/json',
            'X-Agent-Secret': 'wrong-secret',
          })
        )
      ).status
    ).toBe(401);
  });

  it('returns 400 for malformed payloads', async () => {
    const response = await POST(
      createRequest({ lead: { ...validPayload.lead, name: '' } })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details).toBeDefined();
  });

  it('returns 400 for invalid JSON payloads', async () => {
    const request = new Request('http://localhost:3000/api/agent/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Agent-Secret': 'test-agent-secret',
      },
      body: '{invalid-json',
    });

    expect((await POST(request)).status).toBe(400);
  });

  it('returns 429 when rate limits are exceeded', async () => {
    const { getRateLimiterForAuth } = jest.requireMock('@/lib/rate-limiter');
    const { RateLimitError } = jest.requireActual('@/lib/errors');
    getRateLimiterForAuth.mockReturnValue({
      check: jest.fn().mockRejectedValue(new RateLimitError(60)),
    });

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.retryAfter).toBe(60);
  });

  it('returns 500 for unexpected database failures', async () => {
    (submitLead as jest.Mock).mockResolvedValue({
      kind: 'error',
      error: { code: '42501', message: 'permission denied' },
    });
    expect((await POST(createRequest())).status).toBe(500);
  });

  it('returns 500 when lead submission throws', async () => {
    (submitLead as jest.Mock).mockRejectedValue(
      new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
    );

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });

  it('includes security headers on responses', async () => {
    (submitLead as jest.Mock).mockResolvedValue({
      kind: 'created',
      id: 1,
      created_at: '2026-06-19T00:00:00.000Z',
    });

    const response = await POST(createRequest());
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });
});
