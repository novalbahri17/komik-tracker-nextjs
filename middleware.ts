import { NextRequest, NextResponse } from 'next/server';
import { getAuthTokenFromRequest, getUserFromToken } from './lib/auth';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/auth/login',
  '/auth/register',
  '/auth/forgot',
  '/auth/reset',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot',
  '/api/auth/reset',
  '/api/healthz',
];

// Define static file patterns
const staticFilePatterns = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/static',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public or static
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  const isStaticFile = staticFilePatterns.some(pattern =>
    pathname.startsWith(pattern)
  );

  // Skip authentication for public routes and static files
  if (isPublicRoute || isStaticFile) {
    return NextResponse.next();
  }

  // For all other routes, check for authentication
  const token = getAuthTokenFromRequest(request);

  if (!token) {
    // Redirect to login for protected routes
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token and get user
  const user = await getUserFromToken(token);

  if (!user) {
    // Token is invalid, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);

  // Continue with the request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};