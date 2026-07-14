import { logger } from '@/lib/logger';

describe('logger', () => {
  it('redacts sensitive fields from log context', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    logger.info('test event', {
      requestId: 'abc',
      agentSecret: 'super-secret',
      password: 'hidden',
      maps_url: 'https://maps.google.com/test',
    });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('supports api and database logging helpers', () => {
    const infoSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    logger.logApiRequest('POST', '/api/agent/leads', 201, 45, { requestId: 'req-1' });
    logger.logDatabaseOperation('insert', 'leads', 30, true, { requestId: 'req-1' });

    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });

  it('respects configured log levels', () => {
    process.env.LOG_LEVEL = 'error';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    logger.info('hidden info message');
    expect(logSpy).not.toHaveBeenCalled();

    delete process.env.LOG_LEVEL;
    logSpy.mockRestore();
  });

  it('logs errors and truncates long context values', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.error('failure', { details: 'x'.repeat(600) });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('supports debug logging when enabled', () => {
    process.env.LOG_LEVEL = 'debug';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    logger.debug('debug message', { requestId: 'debug-1' });
    expect(logSpy).toHaveBeenCalled();
    delete process.env.LOG_LEVEL;
    logSpy.mockRestore();
  });

  it('writes json logs in production mode', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    jest.replaceProperty(process.env, 'NODE_ENV', 'production');
    logger.info('production event', { requestId: 'prod-1' });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('production event'));

    jest.replaceProperty(process.env, 'NODE_ENV', 'test');
    logSpy.mockRestore();
  });
});
