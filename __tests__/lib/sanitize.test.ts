import { sanitizeInput, sanitizeOptionalText, sanitizeText } from '@/lib/sanitize';

describe('sanitize utilities', () => {
  it('strips HTML tags from text input', () => {
    expect(sanitizeText('<script>alert(1)</script>Acme Corp')).toBe('Acme Corp');
  });

  it('trims whitespace from text input', () => {
    expect(sanitizeText('  Acme Corp  ')).toBe('Acme Corp');
  });

  it('returns undefined for empty optional values', () => {
    expect(sanitizeOptionalText('   ')).toBeUndefined();
    expect(sanitizeOptionalText(undefined)).toBeUndefined();
  });

  it('sanitizes optional text values', () => {
    expect(sanitizeOptionalText(' 123 Main St ')).toBe('123 Main St');
  });

  it('sanitizeInput removes injection and traversal patterns', () => {
    expect(sanitizeInput('<script>x</script>../etc')).not.toContain('../');
    expect(sanitizeInput('${jndi:ldap://x}')).not.toContain('${jndi:');
    expect(sanitizeInput('....//secret')).not.toContain('../');
    expect(sanitizeInput('<style>body{}</style>Hello')).toBe('Hello');
  });
});
