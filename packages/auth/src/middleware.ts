import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { setContext, logger, type RequestContext } from '@acme/core';

export async function authMiddleware(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const context: RequestContext = {
      traceId: crypto.randomUUID(),
    };

    if (session?.user) {
      context.userId = session.user.id;
      context.isSuperuser = session.user.isSuperuser;
      
      // Extract tenant from URL path /(app)/[tenant]/...
      const pathMatch = request.nextUrl.pathname.match(/^\/([^\/]+)\/(.+)$/);
      if (pathMatch) {
        context.tenantId = pathMatch[1];
      }
    }

    setContext(context);
    
    // Add context to headers for downstream consumption
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', context.userId || '');
    requestHeaders.set('x-tenant-id', context.tenantId || '');
    requestHeaders.set('x-is-superuser', context.isSuperuser ? 'true' : 'false');
    requestHeaders.set('x-trace-id', context.traceId || '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return NextResponse.next();
  }
}
