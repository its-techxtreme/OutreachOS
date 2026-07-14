import {
  getClientIp,
  MAX_REQUEST_BODY_BYTES,
  readJsonBody,
  withApiHeaders,
} from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

describe('api helpers', () => {
  it('extracts the first forwarded IP address', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.10, 70.41.3.18' },
    });

    expect(getClientIp(request)).toBe('203.0.113.10');
  });

  it('adds cors, security, and request id headers', () => {
    const response = withApiHeaders(NextResponse.json({ ok: true }), 'req-123');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Request-ID')).toBe('req-123');
  });

  it('parses json request bodies', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ lead: { name: 'Test' } }),
    });

    await expect(readJsonBody(request)).resolves.toEqual({ lead: { name: 'Test' } });
  });

  it('rejects invalid json payloads', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: '{invalid-json',
    });

    await expect(readJsonBody(request)).rejects.toThrow('Invalid JSON payload');
  });

  it('rejects oversized request bodies', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-length': String(MAX_REQUEST_BODY_BYTES + 1) },
      body: '{}',
    });

    await expect(readJsonBody(request)).rejects.toThrow('Request body too large');
  });

  it('rejects bodies that exceed the limit after reading text', async () => {
    const oversizedBody = 'a'.repeat(MAX_REQUEST_BODY_BYTES + 1);
    const request = new Request('http://localhost', {
      method: 'POST',
      body: oversizedBody,
    });

    await expect(readJsonBody(request)).rejects.toThrow('Request body too large');
  });
});
