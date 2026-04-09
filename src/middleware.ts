import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection and access control.
 * It uses the 'auth_token' cookie to determine authentication status.
 */

// List of routes that can be accessed without authentication
const PUBLIC_ROUTES = [
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

  // Get the auth token from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const isAuthenticated = !!authToken;

  // 1. If user is authenticated and tries to access an auth page (login, etc.),
  // redirect them to the dashboard.
  const isAuthPage = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. If user is NOT authenticated and tries to access a protected page,
  // redirect them to login.
  // Special exception: allow the root path '/' if it redirects to login (which it does in our app)
  // or just treat everything not in PUBLIC_ROUTES as protected.
  if (!isAuthenticated && !isAuthPage && pathname !== '/') {
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
