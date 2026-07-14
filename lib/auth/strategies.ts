import { getEnvVar } from '@/lib/env';

import { isValidApiKey } from './hash';

export interface AuthResult {
  valid: boolean;
  reason?: string;
  userId?: string;
  rateLimitKey?: string;
  strategy?: string;
}

export interface AuthStrategy {
  name: string;
  validate: (request: Request) => Promise<AuthResult>;
}

export class AgentSecretStrategy implements AuthStrategy {
  name = 'agent-secret';

  async validate(request: Request): Promise<AuthResult> {
    const agentSecret = request.headers.get('X-Agent-Secret');

    if (!agentSecret) {
      return { valid: false, reason: 'Missing X-Agent-Secret header' };
    }

    let expectedSecret: string;
    try {
      expectedSecret = getEnvVar('AGENT_SECRET');
    } catch {
      return { valid: false, reason: 'Agent secret not configured' };
    }

    if (agentSecret !== expectedSecret) {
      return { valid: false, reason: 'Invalid agent secret' };
    }

    return {
      valid: true,
      userId: 'chatgpt-agent',
      rateLimitKey: `agent:${agentSecret.slice(-8)}`,
      strategy: this.name,
    };
  }
}

export class ApiKeyStrategy implements AuthStrategy {
  name = 'api-key';

  async validate(request: Request): Promise<AuthResult> {
    const authorization = request.headers.get('Authorization');
    const apiKey = authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!apiKey) {
      return { valid: false, reason: 'Missing API key' };
    }

    if (!isValidApiKey(apiKey)) {
      return { valid: false, reason: 'Invalid API key' };
    }

    return {
      valid: true,
      userId: 'api-key-user',
      rateLimitKey: `api-key:${apiKey.slice(-8)}`,
      strategy: this.name,
    };
  }
}

const defaultStrategies: AuthStrategy[] = [
  new AgentSecretStrategy(),
  new ApiKeyStrategy(),
];

export async function validateApiKey(
  request: Request,
  strategies: AuthStrategy[] = defaultStrategies
): Promise<AuthResult> {
  for (const strategy of strategies) {
    const result = await strategy.validate(request);
    if (result.valid) {
      return result;
    }
  }

  return { valid: false, reason: 'No valid authentication method found' };
}
