import { GET } from '@/app/api/health/route';
import { isServerEnvConfigured } from '@/lib/env';
import { getSupabaseServer } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  isServerEnvConfigured: jest.fn(),
}));

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isServerEnvConfigured as jest.Mock).mockReturnValue(true);
  });

  it('returns healthy status when dependencies are available', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.checks.database).toBe(true);
    expect(body.checks.environment).toBe(true);
    expect(body.responseTime).toBeGreaterThanOrEqual(0);
  });

  it('returns unhealthy status when database check fails', async () => {
    (getSupabaseServer as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ error: { message: 'connection failed' } }),
        }),
      }),
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.checks.database).toBe(false);
  });

  it('returns error status when health check throws', async () => {
    (getSupabaseServer as jest.Mock).mockImplementation(() => {
      throw new Error('Supabase unavailable');
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('error');
  });
});
