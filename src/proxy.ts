import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/admin', '/dashboard', '/settings'];
const SESSION_REQUIRED_API_PREFIXES = ['/api/leads', '/api/admin'];
const PUBLIC_API_PREFIXES = [
  '/api/agent',
  '/api/health',
  '/api/metrics',
  '/api/auth',
];

function applySecurityHeaders(
  response: NextResponse,
  requestId: string
): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set('X-Request-ID', requestId);
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;"
  );
  return response;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export default async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = request.nextUrl;

  try {
    // Dynamic import avoids top-level await / adapterFn issues in Next.js 16 proxy.
    const { updateSession } = await import('@/lib/supabase/middleware');
    const { user, supabaseResponse } = await updateSession(request);
    const response = applySecurityHeaders(supabaseResponse, requestId);
    const ip = getClientIp(request);

    const isProtectedPage = PROTECTED_PATHS.some((path) =>
      pathname.startsWith(path)
    );

    if (isProtectedPage && !user) {
      console.warn(
        JSON.stringify({
          level: 'warn',
          message: 'Unauthorized access attempt to protected route',
          requestId,
          pathname,
          ip,
        })
      );

      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return applySecurityHeaders(
        NextResponse.redirect(loginUrl),
        requestId
      );
    }

    if (pathname.startsWith('/api')) {
      const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );
      const requiresSession = SESSION_REQUIRED_API_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (!isPublicApi && requiresSession && !user) {
        console.warn(
          JSON.stringify({
            level: 'warn',
            message: 'Unauthorized API access attempt',
            requestId,
            pathname,
            ip,
          })
        );

        return applySecurityHeaders(
          NextResponse.json(
            { error: 'Unauthorized', requestId },
            { status: 401 }
          ),
          requestId
        );
      }
    }

    if (
      (pathname.startsWith('/auth/login') ||
        pathname.startsWith('/auth/signup')) &&
      user
    ) {
      const redirectTo =
        request.nextUrl.searchParams.get('redirect') || '/dashboard';
      return applySecurityHeaders(
        NextResponse.redirect(new URL(redirectTo, request.url)),
        requestId
      );
    }

    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Proxy error',
        requestId,
        pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    );

    return applySecurityHeaders(NextResponse.next(), requestId);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
