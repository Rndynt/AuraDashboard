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
  
  // Check for session cookie (both dev and prod names)
  // Dev: 'better-auth.session_token', Prod: '__Secure-better-auth.session_token'
  const sessionCookie = request.cookies.get('better-auth.session_token') ?? 
                       request.cookies.get('__Secure-better-auth.session_token');
  
  // Protect all tenant routes and dashboard
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          (pathname !== '/' && pathname !== '/auth' && 
                           !pathname.startsWith('/api') && 
                           !pathname.startsWith('/_next') &&
                           !pathname.startsWith('/favicon'));
  
  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // If on auth page with valid session, redirect to default tenant dashboard
  if (sessionCookie && pathname === '/auth') {
    return NextResponse.redirect(new URL('/acme-corp/dashboard', request.url));
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
