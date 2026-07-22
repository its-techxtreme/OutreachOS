import {
  AgentSecretStrategy,
  ApiKeyStrategy,
  hashApiKey,
  isValidApiKey,
  validateApiKey,
} from '@/lib/auth';

describe('auth hash utilities', () => {
  it('hashes api keys consistently with scrypt', () => {
    const a = hashApiKey('test-key');
    const b = hashApiKey('test-key');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(hashApiKey('other-key'));
  });

  it('validates configured api keys from environment', () => {
    process.env.API_KEYS = 'alpha-key,beta-key';
    expect(isValidApiKey('alpha-key')).toBe(true);
    expect(isValidApiKey('unknown-key')).toBe(false);
    delete process.env.API_KEYS;
  });

  it('returns false when no api keys are configured', () => {
    delete process.env.API_KEYS;
    expect(isValidApiKey('any-key')).toBe(false);
  });
});

describe('AgentSecretStrategy', () => {
  it('accepts valid agent secrets', async () => {
    const strategy = new AgentSecretStrategy();
    const request = new Request('http://localhost/api/agent/leads', {
      headers: { 'X-Agent-Secret': 'test-agent-secret' },
    });

    const result = await strategy.validate(request);
    expect(result.valid).toBe(true);
    expect(result.userId).toBe('chatgpt-agent');
  });

  it('rejects missing or invalid secrets', async () => {
    const strategy = new AgentSecretStrategy();

    expect((await strategy.validate(new Request('http://localhost'))).valid).toBe(false);
    expect(
      (
        await strategy.validate(
          new Request('http://localhost', {
            headers: { 'X-Agent-Secret': 'wrong' },
          })
        )
      ).valid
    ).toBe(false);
  });

  it('reports when agent secret is not configured', async () => {
    const original = process.env.AGENT_SECRET;
    delete process.env.AGENT_SECRET;

    const strategy = new AgentSecretStrategy();
    const result = await strategy.validate(
      new Request('http://localhost', {
        headers: { 'X-Agent-Secret': 'missing-config' },
      })
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Agent secret not configured');

    process.env.AGENT_SECRET = original;
  });
});

describe('ApiKeyStrategy', () => {
  it('accepts bearer api keys when configured', async () => {
    process.env.API_KEYS = 'programmatic-key';
    const strategy = new ApiKeyStrategy();
    const request = new Request('http://localhost/api/agent/leads', {
      headers: { Authorization: 'Bearer programmatic-key' },
    });

    const result = await strategy.validate(request);
    expect(result.valid).toBe(true);
    expect(result.strategy).toBe('api-key');
    delete process.env.API_KEYS;
  });

  it('rejects missing bearer tokens', async () => {
    const strategy = new ApiKeyStrategy();
    const result = await strategy.validate(new Request('http://localhost'));
    expect(result.valid).toBe(false);
  });

  it('rejects invalid bearer tokens when keys are configured', async () => {
    process.env.API_KEYS = 'valid-key';
    const strategy = new ApiKeyStrategy();
    const result = await strategy.validate(
      new Request('http://localhost', {
        headers: { Authorization: 'Bearer invalid-key' },
      })
    );

    expect(result.valid).toBe(false);
    delete process.env.API_KEYS;
  });
});

describe('validateApiKey', () => {
  it('returns first successful strategy result', async () => {
    const request = new Request('http://localhost/api/agent/leads', {
      headers: { 'X-Agent-Secret': 'test-agent-secret' },
    });

    const result = await validateApiKey(request);
    expect(result.valid).toBe(true);
    expect(result.strategy).toBe('agent-secret');
  });
});
