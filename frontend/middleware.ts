import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session cookie
  const sessionCookie = process.env.SESSION_COOKIE_NAME || 'session';
  const session = request.cookies.get(sessionCookie);

  // Define protected and public routes
  const protectedRoutes = ['/main', '/my-cards', '/generation', '/factions']; // Add more as needed
  const publicRoutes = ['/intro', '/signup', '/login']; // Login and signup pages

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // --- Redirect Logic ---

  // 1. If user has no session and is trying to access a protected route, redirect to login.
  if (!session && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/intro';
    console.log(`[Middleware] No session. Redirecting from ${pathname} to /intro.`);
    return NextResponse.redirect(url);
  }

  // 2. If user has a session and is trying to access a public route (like login), redirect to main.
  if (session && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/main';
    console.log(`[Middleware] Session found. Redirecting from ${pathname} to /main.`);
    return NextResponse.redirect(url);
  }

  // If none of the above, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  // Matcher to specify which routes the middleware should run on.
  // Avoid matching API routes, static files, and image optimization routes.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
