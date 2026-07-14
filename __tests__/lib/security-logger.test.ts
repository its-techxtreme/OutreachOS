import { SecurityEventType, SecurityLogger } from '@/lib/security-logger';

describe('SecurityLogger', () => {
  it('logs security events without throwing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    SecurityLogger.log(SecurityEventType.AUTH_FAILURE, {
      requestId: 'req-123',
      path: '/api/agent/leads',
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('uses console.error in production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env = { ...process.env, NODE_ENV: 'production' };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    SecurityLogger.log(SecurityEventType.INVALID_API_KEY, { requestId: 'req-456' });

    expect(errorSpy).toHaveBeenCalledWith('SECURITY_EVENT', expect.any(Object));
    errorSpy.mockRestore();
    process.env = { ...process.env, NODE_ENV: originalNodeEnv };
  });
});
