import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPERADMIN_LOGIN_ROUTE = '/login-superadmin';
const SUPERADMIN_DASHBOARD_PREFIX = '/superadmin_dashboard';

const AUTH_ONLY_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/check-email',
  '/activate-invitation',
  '/password-reset-success',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get('auth_token')?.value;
  const isAuthenticated = !!authToken;

  const isAuthOnlyPage = AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route));
  const isSuperAdminLogin = pathname.startsWith(SUPERADMIN_LOGIN_ROUTE);
  const isSuperAdminDashboard = pathname.startsWith(SUPERADMIN_DASHBOARD_PREFIX);

  if (isAuthenticated && isAuthOnlyPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAuthenticated && isSuperAdminLogin) {
    return NextResponse.redirect(new URL(SUPERADMIN_DASHBOARD_PREFIX, request.url));
  }

  if (!isAuthenticated && isSuperAdminDashboard) {
    return NextResponse.redirect(new URL(SUPERADMIN_LOGIN_ROUTE, request.url));
  }

  if (!isAuthenticated && !isAuthOnlyPage && !isSuperAdminLogin && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

/**
 * Configure which paths the middleware should run on.
 * We exclude static assets, _next internals, and API routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)',
  ],
};
