import { NextResponse } from 'next/server';

export const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.ALLOWED_ORIGINS ?? 'https://chat.openai.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Secret, Authorization',
  'Access-Control-Max-Age': '86400',
};

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function withApiHeaders(
  response: NextResponse,
  requestId?: string
): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }

  return response;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'localhost'
  );
}

export const MAX_REQUEST_BODY_BYTES = 1024 * 64;

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
      throw new Error('Request body too large');
    }
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_REQUEST_BODY_BYTES) {
    throw new Error('Request body too large');
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new SyntaxError('Invalid JSON payload');
  }
}
