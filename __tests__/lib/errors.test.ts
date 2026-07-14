import { DatabaseError, RateLimitError, AuthenticationError } from '@/lib/errors';

describe('custom errors', () => {
  it('creates rate limit errors with retry metadata', () => {
    const error = new RateLimitError(30);
    expect(error.name).toBe('RateLimitError');
    expect(error.retryAfter).toBe(30);
  });

  it('creates database errors with optional codes', () => {
    const error = new DatabaseError('insert failed', '23505');
    expect(error.name).toBe('DatabaseError');
    expect(error.code).toBe('23505');
  });

  it('creates authentication errors', () => {
    const error = new AuthenticationError('Invalid token');
    expect(error.name).toBe('AuthenticationError');
    expect(error.message).toBe('Invalid token');
  });
});
