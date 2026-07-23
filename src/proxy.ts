import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/admin', '/dashboard', '/settings'];
const PUBLIC_ADMIN_PATHS = ['/admin/login'];
const SESSION_REQUIRED_API_PREFIXES = [
  '/api/leads',
  '/api/admin',
  '/api/scripts',
  '/api/quests',
  '/api/billing/checkout',
  '/api/billing/portal',
  '/api/billing/status',
  '/api/account',
];
const PUBLIC_API_PREFIXES = [
  '/api/agent',
  '/api/health',
  '/api/metrics',
  '/api/auth',
  '/api/billing/webhook',
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
    const { user, supabaseResponse, supabase } = await updateSession(request);
    const response = applySecurityHeaders(supabaseResponse, requestId);
    const ip = getClientIp(request);

    if (user) {
      const { getAccountDisableState, disabledAccountPath } = await import(
        '@/lib/auth/account-status'
      );
      const disable = getAccountDisableState(user);
      if (disable.disabled && !pathname.startsWith('/auth/disabled')) {
        await supabase?.auth.signOut();
        const notice = NextResponse.redirect(
          new URL(disabledAccountPath(disable.reason), request.url)
        );
        // Clear session cookies from the signed-out response onto the redirect.
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          notice.cookies.set(cookie.name, cookie.value);
        });
        return applySecurityHeaders(notice, requestId);
      }
    }

    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
    const isProtectedPage =
      !isPublicAdminPath &&
      PROTECTED_PATHS.some((path) => pathname.startsWith(path));

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

      const loginUrl = new URL(
        pathname.startsWith('/admin') ? '/admin/login' : '/auth/login',
        request.url
      );
      if (!pathname.startsWith('/admin')) {
        loginUrl.searchParams.set('redirect', pathname);
      } else {
        loginUrl.searchParams.set('next', '/admin/management-dashboard');
      }
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
      const metaUsername =
        typeof user.user_metadata?.username === 'string'
          ? user.user_metadata.username.trim()
          : '';
      const roles = (user.app_metadata?.roles as string[] | undefined) ?? [];
      const needsUsername =
        !roles.includes('demo') && metaUsername.length === 0;
      const redirectTo = needsUsername
        ? '/auth/username'
        : request.nextUrl.searchParams.get('redirect') || '/dashboard';
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
