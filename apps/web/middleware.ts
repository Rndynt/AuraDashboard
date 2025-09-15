import { NextRequest } from 'next/server';
import { authMiddleware } from '@acme/auth';

export async function middleware(request: NextRequest) {
  // Apply auth middleware to all routes
  return authMiddleware(request);
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
