import { getEnvVar, isServerEnvConfigured, validateServerEnv } from '@/lib/env';

describe('env utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns configured environment variables', () => {
    process.env.AGENT_SECRET = 'secret-value';
    expect(getEnvVar('AGENT_SECRET')).toBe('secret-value');
  });

  it('throws when required environment variables are missing', () => {
    delete process.env.AGENT_SECRET;
    expect(() => getEnvVar('AGENT_SECRET')).toThrow(
      'Missing required environment variable: AGENT_SECRET'
    );
  });

  it('validates all required server environment variables', () => {
    expect(() => validateServerEnv()).not.toThrow();
  });

  it('reports whether server environment is configured', () => {
    expect(isServerEnvConfigured()).toBe(true);
    delete process.env.AGENT_SECRET;
    expect(isServerEnvConfigured()).toBe(false);
  });
});
