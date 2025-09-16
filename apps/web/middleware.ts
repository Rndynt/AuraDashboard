import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes and API endpoints
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/auth'
  ) {
    return NextResponse.next();
  }
  
  // For client-side routing, let the app handle authentication
  // The homepage and auth pages will redirect based on session state
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // For protected routes, redirect to auth if no session cookie exists
  // Using lightweight cookie check to avoid Edge runtime issues
  const sessionCookie = request.cookies.get('__Secure-better-auth.session_token');
  
  if (!sessionCookie && (pathname.startsWith('/dashboard') || pathname.includes('/acme-corp'))) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
